import type { Position, ProximityEvent } from '@talk-space/shared/types/messages.js';
import {
  PROXIMITY_RADIUS,
  PROXIMITY_EXIT_RADIUS,
  GRID_CELL_SIZE,
} from '@talk-space/shared/types/messages.js';

interface GridUser {
  id: string;
  position: Position;
  cellKey: string;
}

export class SpatialGrid {
  private cells = new Map<string, Set<string>>();
  private users = new Map<string, GridUser>();
  private proximityPairs = new Map<string, Set<string>>();

  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / GRID_CELL_SIZE);
    const cellY = Math.floor(y / GRID_CELL_SIZE);
    return `${cellX}:${cellY}`;
  }

  addUser(userId: string, position: Position): void {
    const cellKey = this.getCellKey(position.x, position.y);

    this.users.set(userId, { id: userId, position: { ...position }, cellKey });
    this.proximityPairs.set(userId, new Set());

    if (!this.cells.has(cellKey)) {
      this.cells.set(cellKey, new Set());
    }
    this.cells.get(cellKey)!.add(userId);
  }

  /**
   * Remove user from grid. Returns list of users who were in proximity
   * so the server can emit proximityExit events for cleanup.
   */
  removeUser(userId: string): string[] {
    const user = this.users.get(userId);
    if (!user) return [];

    // Remove from cell
    const cell = this.cells.get(user.cellKey);
    if (cell) {
      cell.delete(userId);
      if (cell.size === 0) this.cells.delete(user.cellKey);
    }

    // Get users who were in proximity for cleanup
    const nearbyUserIds = Array.from(this.proximityPairs.get(userId) || []);

    // Remove this user from all other users' proximity sets
    for (const otherId of nearbyUserIds) {
      this.proximityPairs.get(otherId)?.delete(userId);
    }

    this.proximityPairs.delete(userId);
    this.users.delete(userId);

    return nearbyUserIds;
  }

  /**
   * Update user position and detect proximity transitions.
   * Returns ProximityEvent[] for pairs that entered or exited proximity.
   * Hysteresis: enter at <= PROXIMITY_RADIUS (100), exit at > PROXIMITY_EXIT_RADIUS (105).
   */
  updatePosition(userId: string, position: Position): ProximityEvent[] {
    const user = this.users.get(userId);
    if (!user) return [];

    const oldCellKey = user.cellKey;
    const newCellKey = this.getCellKey(position.x, position.y);

    user.position.x = position.x;
    user.position.y = position.y;

    // Update cell membership if changed
    if (oldCellKey !== newCellKey) {
      const oldCell = this.cells.get(oldCellKey);
      if (oldCell) {
        oldCell.delete(userId);
        if (oldCell.size === 0) this.cells.delete(oldCellKey);
      }

      if (!this.cells.has(newCellKey)) {
        this.cells.set(newCellKey, new Set());
      }
      this.cells.get(newCellKey)!.add(userId);
      user.cellKey = newCellKey;
    }

    // Check 9 adjacent cells for nearby users
    const events: ProximityEvent[] = [];
    const myProximity = this.proximityPairs.get(userId)!;
    const checkedUsers = new Set<string>();

    const cellX = Math.floor(position.x / GRID_CELL_SIZE);
    const cellY = Math.floor(position.y / GRID_CELL_SIZE);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const neighborKey = `${cellX + dx}:${cellY + dy}`;
        const cell = this.cells.get(neighborKey);
        if (!cell) continue;

        for (const otherId of cell) {
          if (otherId === userId || checkedUsers.has(otherId)) continue;
          checkedUsers.add(otherId);

          const other = this.users.get(otherId);
          if (!other) continue;

          const ddx = position.x - other.position.x;
          const ddy = position.y - other.position.y;
          const distance = Math.sqrt(ddx * ddx + ddy * ddy);

          const wasInProximity = myProximity.has(otherId);

          if (!wasInProximity && distance <= PROXIMITY_RADIUS) {
            myProximity.add(otherId);
            this.proximityPairs.get(otherId)!.add(userId);
            events.push({ type: 'enter', userId: otherId, distance });
          } else if (wasInProximity && distance > PROXIMITY_EXIT_RADIUS) {
            myProximity.delete(otherId);
            this.proximityPairs.get(otherId)!.delete(userId);
            events.push({ type: 'exit', userId: otherId, distance });
          }
        }
      }
    }

    return events;
  }

  getNearbyUsers(userId: string): string[] {
    return Array.from(this.proximityPairs.get(userId) || []);
  }

  areInProximity(userA: string, userB: string): boolean {
    return this.proximityPairs.get(userA)?.has(userB) ?? false;
  }

  getDistance(userA: string, userB: string): number {
    const a = this.users.get(userA);
    const b = this.users.get(userB);
    if (!a || !b) return Infinity;

    const dx = a.position.x - b.position.x;
    const dy = a.position.y - b.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
