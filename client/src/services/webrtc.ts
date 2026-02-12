import { Device, types as mediasoupTypes } from 'mediasoup-client';
import { getSocket } from './socket';
import { useGameStore } from '../store/useGameStore';
import { MAX_AUDIO_CONNECTIONS } from '@shared/types/messages';
import { spatialAudio } from './spatialAudio';

type Transport = mediasoupTypes.Transport;
type Producer = mediasoupTypes.Producer;
type Consumer = mediasoupTypes.Consumer;

// Module-level state
let device: Device | null = null;
let sendTransport: Transport | null = null;
let recvTransport: Transport | null = null;
let audioProducer: Producer | null = null;

// Map: remote userId -> Consumer
const consumers = new Map<string, Consumer>();

// Map: remote userId -> producerId (learned from server)
const knownProducers = new Map<string, string>();

// Audio stream from getUserMedia
let localStream: MediaStream | null = null;

const SIGNALING_TIMEOUT_MS = 10_000;

function withTimeout<T>(promise: Promise<T>, ms = SIGNALING_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Signaling timeout after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * Initialize the mediasoup Device with router's RTP capabilities.
 */
async function ensureDevice(): Promise<Device> {
  if (device?.loaded) return device;

  device = new Device();

  const socket = getSocket();
  if (!socket) throw new Error('Socket not connected');

  const rtpCapabilities = await withTimeout(new Promise<unknown>((resolve) => {
    socket.emit('getRouterRtpCapabilities' as any, (caps: unknown) => {
      resolve(caps);
    });
  }));

  await device.load({
    routerRtpCapabilities: rtpCapabilities as any,
  });

  return device;
}

/**
 * Create the send transport for producing audio.
 */
async function ensureSendTransport(): Promise<Transport> {
  if (sendTransport && !sendTransport.closed) return sendTransport;

  const dev = await ensureDevice();
  const socket = getSocket();
  if (!socket) throw new Error('Socket not connected');

  const transportOptions = await withTimeout(new Promise<any>((resolve) => {
    socket.emit('createTransport' as any, { direction: 'send' }, resolve);
  }));

  sendTransport = dev.createSendTransport(transportOptions);

  sendTransport.on(
    'connect',
    ({ dtlsParameters }: { dtlsParameters: unknown }, callback: () => void, errback: (err: Error) => void) => {
      socket.emit(
        'connectTransport' as any,
        { transportId: sendTransport!.id, dtlsParameters },
        (response: { connected: boolean }) => {
          if (response.connected) callback();
          else errback(new Error('Transport connect failed'));
        }
      );
    }
  );

  sendTransport.on(
    'produce',
    ({ kind, rtpParameters }: { kind: string; rtpParameters: unknown }, callback: (arg: { id: string }) => void, errback: (err: Error) => void) => {
      socket.emit(
        'produce' as any,
        { transportId: sendTransport!.id, kind, rtpParameters },
        (response: { producerId: string }) => {
          if (response.producerId) callback({ id: response.producerId });
          else errback(new Error('Produce failed'));
        }
      );
    }
  );

  return sendTransport;
}

/**
 * Create the recv transport for consuming remote audio.
 */
async function ensureRecvTransport(): Promise<Transport> {
  if (recvTransport && !recvTransport.closed) return recvTransport;

  const dev = await ensureDevice();
  const socket = getSocket();
  if (!socket) throw new Error('Socket not connected');

  const transportOptions = await withTimeout(new Promise<any>((resolve) => {
    socket.emit('createTransport' as any, { direction: 'recv' }, resolve);
  }));

  recvTransport = dev.createRecvTransport(transportOptions);

  recvTransport.on(
    'connect',
    ({ dtlsParameters }: { dtlsParameters: unknown }, callback: () => void, errback: (err: Error) => void) => {
      socket.emit(
        'connectTransport' as any,
        { transportId: recvTransport!.id, dtlsParameters },
        (response: { connected: boolean }) => {
          if (response.connected) callback();
          else errback(new Error('Transport connect failed'));
        }
      );
    }
  );

  return recvTransport;
}

/**
 * Get microphone and start producing audio. Called lazily on first proximity enter.
 */
async function ensureProducing(): Promise<void> {
  if (audioProducer && !audioProducer.closed) return;

  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 1,
      },
    });
    useGameStore.getState().setMicInitialized(true);
  }

  const transport = await ensureSendTransport();
  const audioTrack = localStream.getAudioTracks()[0];

  audioProducer = await transport.produce({
    track: audioTrack,
    codecOptions: {
      opusStereo: false,
      opusDtx: true,
      opusFec: true,
      opusMaxPlaybackRate: 48000,
    },
  });

  // Sync mute state
  if (useGameStore.getState().muted) {
    audioProducer.pause();
  }
}

/**
 * Consume a remote user's audio producer.
 */
async function consumeProducer(
  userId: string,
  producerId: string
): Promise<void> {
  if (consumers.has(userId)) return;

  // Enforce max connections
  if (consumers.size >= MAX_AUDIO_CONNECTIONS) {
    disconnectFarthestUser();
  }

  const dev = await ensureDevice();
  const transport = await ensureRecvTransport();
  const socket = getSocket();
  if (!socket || !dev.rtpCapabilities) return;

  const consumeOptions = await withTimeout(new Promise<any>((resolve) => {
    socket.emit(
      'consume' as any,
      { producerId, rtpCapabilities: dev.rtpCapabilities },
      resolve
    );
  }));

  if (!consumeOptions || !consumeOptions.id) {
    console.warn(`Failed to consume producer ${producerId} from user ${userId}`);
    return;
  }

  const consumer = await transport.consume({
    id: consumeOptions.id,
    producerId: consumeOptions.producerId,
    kind: consumeOptions.kind,
    rtpParameters: consumeOptions.rtpParameters,
  });

  consumers.set(userId, consumer);
  knownProducers.set(userId, producerId);

  // Route audio through spatial audio service for 3D positioning
  const stream = new MediaStream([consumer.track]);
  spatialAudio.addStream(userId, stream);

  // Resume consumer on server (created paused)
  socket.emit('consumerResume' as any, { consumerId: consumer.id }, () => {});

  useGameStore.getState().setActiveVoiceConnections(consumers.size);

  consumer.on('transportclose', () => {
    spatialAudio.removeStream(userId);
    consumers.delete(userId);
    knownProducers.delete(userId);
    useGameStore.getState().setActiveVoiceConnections(consumers.size);
  });

  consumer.on('trackended', () => {
    spatialAudio.removeStream(userId);
    consumers.delete(userId);
    knownProducers.delete(userId);
    useGameStore.getState().setActiveVoiceConnections(consumers.size);
  });
}

function disconnectUser(userId: string): void {
  const consumer = consumers.get(userId);
  if (consumer) {
    consumer.close();
    consumers.delete(userId);
  }
  knownProducers.delete(userId);
  spatialAudio.removeStream(userId);
  useGameStore.getState().setActiveVoiceConnections(consumers.size);
}

function disconnectFarthestUser(): void {
  const store = useGameStore.getState();
  const localPos = store.localPlayer?.position;
  if (!localPos) return;

  let farthestId: string | null = null;
  let farthestDist = -1;

  for (const [userId] of consumers) {
    const remote = store.remotePlayers.get(userId);
    if (!remote) continue;

    const dx = localPos.x - remote.position.x;
    const dy = localPos.y - remote.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > farthestDist) {
      farthestDist = dist;
      farthestId = userId;
    }
  }

  if (farthestId) {
    disconnectUser(farthestId);
  }
}

// --- PUBLIC API ---

export async function handleProximityEnter(userId: string): Promise<void> {
  useGameStore.getState().addNearbyUser(userId);

  // Play proximity notification sound
  spatialAudio.playNotificationSound();

  try {
    await ensureProducing();
  } catch (err) {
    console.error('Failed to start audio production:', err);
  }

  // If we know the other user's producer, consume it
  const producerId = knownProducers.get(userId);
  if (producerId) {
    try {
      await consumeProducer(userId, producerId);
    } catch (err) {
      console.error(`Failed to consume audio from ${userId}:`, err);
    }
  }
}

export function handleProximityExit(userId: string): void {
  useGameStore.getState().removeNearbyUser(userId);
  disconnectUser(userId);
}

export async function handleNewProducer(
  userId: string,
  producerId: string
): Promise<void> {
  knownProducers.set(userId, producerId);

  // Only consume if this user is in our nearby set
  const { nearbyUsers } = useGameStore.getState();
  if (!nearbyUsers.has(userId)) return;

  try {
    await consumeProducer(userId, producerId);
  } catch (err) {
    console.error(`Failed to consume new producer from ${userId}:`, err);
  }
}

export function handleProducerClosed(userId: string): void {
  disconnectUser(userId);
}

export function toggleMute(): void {
  const store = useGameStore.getState();
  const newMuted = !store.muted;
  store.setMuted(newMuted);

  if (audioProducer && !audioProducer.closed) {
    if (newMuted) {
      audioProducer.pause();
    } else {
      audioProducer.resume();
    }
  }
}

export function cleanupWebRTC(): void {
  for (const [userId, consumer] of consumers) {
    consumer.close();
    spatialAudio.removeStream(userId);
  }
  consumers.clear();
  knownProducers.clear();

  if (audioProducer && !audioProducer.closed) {
    audioProducer.close();
  }
  audioProducer = null;

  if (sendTransport && !sendTransport.closed) sendTransport.close();
  if (recvTransport && !recvTransport.closed) recvTransport.close();
  sendTransport = null;
  recvTransport = null;

  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop());
    localStream = null;
  }

  device = null;

  useGameStore.getState().clearNearbyUsers();
  useGameStore.getState().setActiveVoiceConnections(0);
  useGameStore.getState().setMicInitialized(false);
}
