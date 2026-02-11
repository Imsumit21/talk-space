export interface Position {
  x: number;
  y: number;
}

export interface UserState {
  id: string;
  username: string;
  position: Position;
  color: string;
}

export interface ServerToClientEvents {
  positionUpdate: (users: UserState[]) => void;
  userJoined: (user: UserState) => void;
  userLeft: (userId: string) => void;
  joinSuccess: (data: { id: string; users: UserState[] }) => void;
}

export interface ClientToServerEvents {
  positionUpdate: (position: Position) => void;
  join: (username: string) => void;
}

export const WORLD_WIDTH = 5000;
export const WORLD_HEIGHT = 5000;
export const TICK_RATE = 30;
export const MAX_SPEED_PER_TICK = 8;
