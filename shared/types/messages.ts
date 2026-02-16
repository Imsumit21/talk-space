export interface Position {
  x: number;
  y: number;
}

export interface UserState {
  id: string;
  userId: string; // persistent database UUID
  username: string;
  position: Position;
  color: string;
  avatarUrl?: string;
}

// --- Proximity types ---

export interface ProximityEvent {
  type: "enter" | "exit";
  userId: string;
  distance: number;
}

// --- mediasoup signaling types (use unknown to keep shared dependency-free) ---

export interface TransportOptions {
  id: string;
  iceParameters: unknown;
  iceCandidates: unknown[];
  dtlsParameters: unknown;
}

export interface ConsumeOptions {
  id: string;
  producerId: string;
  kind: "audio";
  rtpParameters: unknown;
}

// --- Socket.io event interfaces ---

export interface ServerToClientEvents {
  // Phase 1: Position sync
  positionUpdate: (users: UserState[]) => void;
  userJoined: (user: UserState) => void;
  userLeft: (userId: string) => void;
  joinSuccess: (data: {
    id: string;
    userId: string;
    users: UserState[];
  }) => void;

  // Phase 2: Proximity
  proximityEnter: (data: { userId: string; distance: number }) => void;
  proximityExit: (data: { userId: string }) => void;

  // Phase 2: mediasoup signaling
  newProducer: (data: { producerId: string; userId: string }) => void;
  producerClosed: (data: { producerId: string; userId: string }) => void;

  // Phase 2: Lobby
  onlineCount: (count: number) => void;

  // Phase 4: Friends notifications
  friendRequest: (data: {
    id: string;
    from: { id: string; username: string };
  }) => void;
  friendAccepted: (data: {
    id: string;
    user: { id: string; username: string };
  }) => void;
}

export interface ClientToServerEvents {
  // Phase 1: Position sync
  positionUpdate: (position: Position) => void;
  join: (
    callback: (data: {
      id: string;
      userId: string;
      users: UserState[];
    }) => void,
  ) => void;

  // Phase 2: mediasoup signaling
  getRouterRtpCapabilities: (callback: (capabilities: unknown) => void) => void;
  createTransport: (
    data: { direction: "send" | "recv" },
    callback: (options: TransportOptions) => void,
  ) => void;
  connectTransport: (
    data: { transportId: string; dtlsParameters: unknown },
    callback: (response: { connected: boolean }) => void,
  ) => void;
  produce: (
    data: { transportId: string; kind: "audio"; rtpParameters: unknown },
    callback: (response: { producerId: string }) => void,
  ) => void;
  consume: (
    data: { producerId: string; rtpCapabilities: unknown },
    callback: (options: ConsumeOptions) => void,
  ) => void;
  consumerResume: (
    data: { consumerId: string },
    callback: (response: { resumed: boolean }) => void,
  ) => void;

  // Phase 2: Lobby
  getOnlineCount: () => void;
}

// --- Constants ---

export const WORLD_WIDTH = 5000;
export const WORLD_HEIGHT = 5000;
export const TICK_RATE = 30;
export const MAX_SPEED_PER_TICK = 8;

// Phase 2 constants
export const PROXIMITY_RADIUS = 100;
export const PROXIMITY_EXIT_RADIUS = 105; // 5-unit hysteresis
export const GRID_CELL_SIZE = 200;
export const MAX_AUDIO_CONNECTIONS = 10;
