import { useEffect, useRef } from 'react';
import { Application, Graphics } from 'pixi.js';
import { Avatar } from './Avatar';
import { useGameStore } from '../store/useGameStore';
import { WORLD_WIDTH, WORLD_HEIGHT } from '@shared/types/messages';

const MOVEMENT_SPEED = 2.5; // pixels per frame at 60fps
const INTERPOLATION_ALPHA = 0.2;
const GRID_SIZE = 200;
const GRID_COLOR = 0x1a1a2e;
const BG_COLOR = 0x0f0f23;

export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const avatarsRef = useRef<Map<string, Avatar>>(new Map());
  const localAvatarRef = useRef<Avatar | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const app = new Application({
      resizeTo: containerRef.current,
      backgroundColor: BG_COLOR,
      antialias: true,
    });

    containerRef.current.appendChild(app.view as HTMLCanvasElement);
    appRef.current = app;

    // Draw world grid
    const grid = new Graphics();
    grid.lineStyle(1, GRID_COLOR, 0.5);
    for (let x = 0; x <= WORLD_WIDTH; x += GRID_SIZE) {
      grid.moveTo(x, 0);
      grid.lineTo(x, WORLD_HEIGHT);
    }
    for (let y = 0; y <= WORLD_HEIGHT; y += GRID_SIZE) {
      grid.moveTo(0, y);
      grid.lineTo(WORLD_WIDTH, y);
    }
    // World border
    grid.lineStyle(2, 0x333366, 1);
    grid.drawRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    app.stage.addChild(grid);

    // Game loop
    app.ticker.add(() => {
      const state = useGameStore.getState();
      const { localPlayer, remotePlayers, pressedKeys } = state;

      if (!localPlayer) return;

      // --- Handle input & move local player ---
      let dx = 0;
      let dy = 0;
      if (pressedKeys.has('w') || pressedKeys.has('arrowup')) dy -= 1;
      if (pressedKeys.has('s') || pressedKeys.has('arrowdown')) dy += 1;
      if (pressedKeys.has('a') || pressedKeys.has('arrowleft')) dx -= 1;
      if (pressedKeys.has('d') || pressedKeys.has('arrowright')) dx += 1;

      if (dx !== 0 || dy !== 0) {
        // Normalize diagonal
        const len = Math.sqrt(dx * dx + dy * dy);
        dx = (dx / len) * MOVEMENT_SPEED;
        dy = (dy / len) * MOVEMENT_SPEED;

        const newX = Math.max(0, Math.min(WORLD_WIDTH, localPlayer.position.x + dx));
        const newY = Math.max(0, Math.min(WORLD_HEIGHT, localPlayer.position.y + dy));

        state.updateLocalPosition({ x: newX, y: newY });
      }

      // --- Sync local avatar ---
      if (!localAvatarRef.current) {
        const avatar = new Avatar(localPlayer.username, localPlayer.color, true);
        localAvatarRef.current = avatar;
        app.stage.addChild(avatar);
      }
      localAvatarRef.current.x = localPlayer.position.x;
      localAvatarRef.current.y = localPlayer.position.y;

      // --- Sync remote avatars ---
      const currentIds = new Set<string>();
      for (const [id, user] of remotePlayers) {
        currentIds.add(id);
        let avatar = avatarsRef.current.get(id);

        if (!avatar) {
          avatar = new Avatar(user.username, user.color, false);
          avatarsRef.current.set(id, avatar);
          app.stage.addChild(avatar);
        }

        avatar.setTarget(user.position.x, user.position.y);
        avatar.interpolate(INTERPOLATION_ALPHA);
      }

      // Remove avatars that left
      for (const [id, avatar] of avatarsRef.current) {
        if (!currentIds.has(id)) {
          app.stage.removeChild(avatar);
          avatar.destroy();
          avatarsRef.current.delete(id);
        }
      }

      // --- Update proximity indicators ---
      const { nearbyUsers } = state;
      for (const [id, avatar] of avatarsRef.current) {
        avatar.setInProximity(nearbyUsers.has(id));
      }
      if (localAvatarRef.current) {
        localAvatarRef.current.setInProximity(nearbyUsers.size > 0);
      }

      // --- Camera follow local player ---
      const screen = app.screen;
      app.stage.pivot.x = localPlayer.position.x;
      app.stage.pivot.y = localPlayer.position.y;
      app.stage.position.x = screen.width / 2;
      app.stage.position.y = screen.height / 2;
    });

    // Keyboard handlers
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      useGameStore.getState().addKey(e.key.toLowerCase());
    };
    const onKeyUp = (e: KeyboardEvent) => {
      useGameStore.getState().removeKey(e.key.toLowerCase());
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);

      // Cleanup avatars
      for (const avatar of avatarsRef.current.values()) {
        avatar.destroy();
      }
      avatarsRef.current.clear();
      localAvatarRef.current = null;

      app.destroy(true, { children: true });
      appRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
