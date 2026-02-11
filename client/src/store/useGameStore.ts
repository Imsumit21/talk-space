import { create } from 'zustand';
import type { Position, UserState } from '@shared/types/messages';

interface LocalPlayer {
  id: string;
  username: string;
  position: Position;
  color: string;
}

interface GameState {
  // Connection
  connected: boolean;
  joined: boolean;

  // Players
  localPlayer: LocalPlayer | null;
  remotePlayers: Map<string, UserState>;

  // Input
  pressedKeys: Set<string>;

  // Actions
  setConnected: (connected: boolean) => void;
  setLocalPlayer: (player: LocalPlayer) => void;
  updateLocalPosition: (position: Position) => void;
  updateRemotePlayers: (users: UserState[]) => void;
  addRemotePlayer: (user: UserState) => void;
  removeRemotePlayer: (userId: string) => void;
  addKey: (key: string) => void;
  removeKey: (key: string) => void;
  setJoined: (joined: boolean) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  connected: false,
  joined: false,
  localPlayer: null,
  remotePlayers: new Map(),
  pressedKeys: new Set(),

  setConnected: (connected) => set({ connected }),

  setJoined: (joined) => set({ joined }),

  setLocalPlayer: (player) => set({ localPlayer: player, joined: true }),

  updateLocalPosition: (position) => {
    const { localPlayer } = get();
    if (!localPlayer) return;
    set({ localPlayer: { ...localPlayer, position } });
  },

  updateRemotePlayers: (users) => {
    const { localPlayer } = get();
    const remotePlayers = new Map<string, UserState>();
    for (const user of users) {
      if (user.id !== localPlayer?.id) {
        remotePlayers.set(user.id, user);
      }
    }
    set({ remotePlayers });
  },

  addRemotePlayer: (user) => {
    const { remotePlayers, localPlayer } = get();
    if (user.id === localPlayer?.id) return;
    const next = new Map(remotePlayers);
    next.set(user.id, user);
    set({ remotePlayers: next });
  },

  removeRemotePlayer: (userId) => {
    const { remotePlayers } = get();
    const next = new Map(remotePlayers);
    next.delete(userId);
    set({ remotePlayers: next });
  },

  addKey: (key) => {
    const { pressedKeys } = get();
    const next = new Set(pressedKeys);
    next.add(key);
    set({ pressedKeys: next });
  },

  removeKey: (key) => {
    const { pressedKeys } = get();
    const next = new Set(pressedKeys);
    next.delete(key);
    set({ pressedKeys: next });
  },
}));
