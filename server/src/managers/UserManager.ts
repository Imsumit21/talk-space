import type { Position, UserState } from '@talk-space/shared/types/messages.js';
import { WORLD_WIDTH, WORLD_HEIGHT, MAX_SPEED_PER_TICK } from '@talk-space/shared/types/messages.js';

const AVATAR_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#e84393', '#00b894', '#6c5ce7',
];

export class UserManager {
  private users = new Map<string, UserState>();
  private colorIndex = 0;

  addUser(id: string, username: string): UserState {
    const color = AVATAR_COLORS[this.colorIndex % AVATAR_COLORS.length];
    this.colorIndex++;

    const user: UserState = {
      id,
      username,
      position: {
        x: WORLD_WIDTH / 2 + (Math.random() - 0.5) * 200,
        y: WORLD_HEIGHT / 2 + (Math.random() - 0.5) * 200,
      },
      color,
    };

    this.users.set(id, user);
    return user;
  }

  removeUser(id: string): boolean {
    return this.users.delete(id);
  }

  updatePosition(id: string, position: Position): boolean {
    const user = this.users.get(id);
    if (!user) return false;

    // Validate movement speed
    const dx = position.x - user.position.x;
    const dy = position.y - user.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > MAX_SPEED_PER_TICK) {
      // Clamp to max speed in the same direction
      const scale = MAX_SPEED_PER_TICK / distance;
      position = {
        x: user.position.x + dx * scale,
        y: user.position.y + dy * scale,
      };
    }

    // Clamp to world bounds
    user.position.x = Math.max(0, Math.min(WORLD_WIDTH, position.x));
    user.position.y = Math.max(0, Math.min(WORLD_HEIGHT, position.y));

    return true;
  }

  getUser(id: string): UserState | undefined {
    return this.users.get(id);
  }

  getAllUsers(): UserState[] {
    return Array.from(this.users.values());
  }

  getUserCount(): number {
    return this.users.size;
  }
}
