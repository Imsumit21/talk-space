import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@shared/types/messages';
import { TICK_RATE } from '@shared/types/messages';
import { useGameStore } from '../store/useGameStore';
import {
  handleProximityEnter,
  handleProximityExit,
  handleNewProducer,
  handleProducerClosed,
  cleanupWebRTC,
} from './webrtc';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
let sendInterval: ReturnType<typeof setInterval> | null = null;

export function connectSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (socket?.connected) return socket;

  socket = io(SERVER_URL, {
    transports: ['websocket'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('Connected to server');
    useGameStore.setState({ connected: true });
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    cleanupWebRTC();
    useGameStore.setState({ connected: false, joined: false });
    stopPositionSync();
  });

  socket.on('joinSuccess', (data) => {
    const allUsers = data.users;
    const me = allUsers.find((u) => u.id === data.id);
    if (!me) return;

    useGameStore.getState().setLocalPlayer({
      id: me.id,
      username: me.username,
      position: me.position,
      color: me.color,
    });

    useGameStore.getState().updateRemotePlayers(allUsers);
    startPositionSync();
  });

  socket.on('positionUpdate', (users) => {
    useGameStore.getState().updateRemotePlayers(users);
  });

  socket.on('userJoined', (user) => {
    useGameStore.getState().addRemotePlayer(user);
  });

  socket.on('userLeft', (userId) => {
    useGameStore.getState().removeRemotePlayer(userId);
  });

  // Proximity events
  socket.on('proximityEnter', (data) => {
    handleProximityEnter(data.userId);
  });

  socket.on('proximityExit', (data) => {
    handleProximityExit(data.userId);
  });

  // mediasoup signaling events
  socket.on('newProducer', (data) => {
    handleNewProducer(data.userId, data.producerId);
  });

  socket.on('producerClosed', (data) => {
    handleProducerClosed(data.userId);
  });

  return socket;
}

export function joinGame(username: string) {
  if (!socket?.connected) return;
  socket.emit('join', username);
}

function startPositionSync() {
  if (sendInterval) return;

  sendInterval = setInterval(() => {
    const { localPlayer } = useGameStore.getState();
    if (localPlayer && socket?.connected) {
      socket.emit('positionUpdate', localPlayer.position);
    }
  }, 1000 / TICK_RATE);
}

function stopPositionSync() {
  if (sendInterval) {
    clearInterval(sendInterval);
    sendInterval = null;
  }
}

export function disconnectSocket() {
  cleanupWebRTC();
  stopPositionSync();
  socket?.disconnect();
  socket = null;
}

export function getSocket() {
  return socket;
}
