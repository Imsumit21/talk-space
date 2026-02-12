import * as mediasoup from 'mediasoup';
import type {
  Worker,
  Router,
  WebRtcTransport,
  Producer,
  Consumer,
  RouterRtpCodecCapability,
  WebRtcTransportOptions,
} from 'mediasoup/types';
import { MAX_AUDIO_CONNECTIONS } from '@talk-space/shared/types/messages.js';

interface UserMedia {
  sendTransport: WebRtcTransport | null;
  recvTransport: WebRtcTransport | null;
  producer: Producer | null;
  consumers: Map<string, Consumer>;
}

const MEDIASOUP_WORKER_SETTINGS = {
  logLevel: 'warn' as const,
  rtcMinPort: parseInt(process.env.MEDIASOUP_MIN_PORT || '40000', 10),
  rtcMaxPort: parseInt(process.env.MEDIASOUP_MAX_PORT || '49999', 10),
};

const MEDIA_CODECS: RouterRtpCodecCapability[] = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  },
];

export class MediasoupService {
  private worker: Worker | null = null;
  private router: Router | null = null;
  private userMedia = new Map<string, UserMedia>();

  async initialize(): Promise<void> {
    this.worker = await mediasoup.createWorker(MEDIASOUP_WORKER_SETTINGS);

    this.worker.on('died', (error: Error) => {
      console.error('mediasoup Worker died:', error);
      setTimeout(() => process.exit(1), 2000);
    });

    this.router = await this.worker.createRouter({
      mediaCodecs: MEDIA_CODECS,
    });

    console.log('mediasoup Worker and Router initialized');
  }

  getRouterRtpCapabilities(): unknown {
    if (!this.router) throw new Error('Router not initialized');
    return this.router.rtpCapabilities;
  }

  addUser(userId: string): void {
    if (this.userMedia.has(userId)) return;
    this.userMedia.set(userId, {
      sendTransport: null,
      recvTransport: null,
      producer: null,
      consumers: new Map(),
    });
  }

  async createTransport(
    userId: string,
    direction: 'send' | 'recv'
  ): Promise<{
    id: string;
    iceParameters: unknown;
    iceCandidates: unknown[];
    dtlsParameters: unknown;
  }> {
    if (!this.router) throw new Error('Router not initialized');

    const userMedia = this.userMedia.get(userId);
    if (!userMedia) throw new Error(`User ${userId} not registered`);

    const announcedIp = process.env.MEDIASOUP_ANNOUNCED_IP || undefined;
    const listenIp = process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0';

    const transportOptions: WebRtcTransportOptions = {
      listenIps: [{ ip: listenIp, announcedIp }],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
    };

    const transport = await this.router.createWebRtcTransport(transportOptions);

    if (direction === 'send') {
      if (userMedia.sendTransport && !userMedia.sendTransport.closed) {
        userMedia.sendTransport.close();
      }
      userMedia.sendTransport = transport;
    } else {
      if (userMedia.recvTransport && !userMedia.recvTransport.closed) {
        userMedia.recvTransport.close();
      }
      userMedia.recvTransport = transport;
    }

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    };
  }

  async connectTransport(
    userId: string,
    transportId: string,
    dtlsParameters: unknown
  ): Promise<void> {
    const transport = this.findTransport(userId, transportId);
    if (!transport) throw new Error(`Transport ${transportId} not found`);

    await transport.connect({
      dtlsParameters: dtlsParameters as mediasoup.types.DtlsParameters,
    });
  }

  async produce(
    userId: string,
    transportId: string,
    kind: 'audio',
    rtpParameters: unknown
  ): Promise<string> {
    const transport = this.findTransport(userId, transportId);
    if (!transport) throw new Error(`Transport ${transportId} not found`);

    const userMedia = this.userMedia.get(userId)!;

    const producer = await transport.produce({
      kind,
      rtpParameters: rtpParameters as mediasoup.types.RtpParameters,
    });

    producer.on('transportclose', () => {
      userMedia.producer = null;
    });

    userMedia.producer = producer;
    return producer.id;
  }

  async consume(
    consumerUserId: string,
    producerUserId: string,
    rtpCapabilities: unknown
  ): Promise<{
    id: string;
    producerId: string;
    kind: 'audio';
    rtpParameters: unknown;
  } | null> {
    if (!this.router) throw new Error('Router not initialized');

    const producerMedia = this.userMedia.get(producerUserId);
    if (!producerMedia?.producer) return null;

    const consumerMedia = this.userMedia.get(consumerUserId);
    if (!consumerMedia?.recvTransport) return null;

    // Enforce server-side max connections limit
    if (consumerMedia.consumers.size >= MAX_AUDIO_CONNECTIONS) return null;

    const canConsume = this.router.canConsume({
      producerId: producerMedia.producer.id,
      rtpCapabilities: rtpCapabilities as mediasoup.types.RtpCapabilities,
    });

    if (!canConsume) return null;

    const consumer = await consumerMedia.recvTransport.consume({
      producerId: producerMedia.producer.id,
      rtpCapabilities: rtpCapabilities as mediasoup.types.RtpCapabilities,
      paused: true,
    });

    consumer.on('transportclose', () => {
      consumerMedia.consumers.delete(consumer.id);
    });

    consumer.on('producerclose', () => {
      consumerMedia.consumers.delete(consumer.id);
    });

    consumerMedia.consumers.set(consumer.id, consumer);

    return {
      id: consumer.id,
      producerId: producerMedia.producer.id,
      kind: 'audio',
      rtpParameters: consumer.rtpParameters,
    };
  }

  async resumeConsumer(userId: string, consumerId: string): Promise<void> {
    const userMedia = this.userMedia.get(userId);
    if (!userMedia) return;

    const consumer = userMedia.consumers.get(consumerId);
    if (!consumer) return;

    await consumer.resume();
  }

  getProducerId(userId: string): string | null {
    return this.userMedia.get(userId)?.producer?.id ?? null;
  }

  hasProducer(userId: string): boolean {
    const media = this.userMedia.get(userId);
    return !!media?.producer && !media.producer.closed;
  }

  findUserByProducerId(producerId: string): string | null {
    for (const [userId, media] of this.userMedia) {
      if (media.producer?.id === producerId) return userId;
    }
    return null;
  }

  getConsumerCount(userId: string): number {
    return this.userMedia.get(userId)?.consumers.size ?? 0;
  }

  removeUser(userId: string): void {
    const userMedia = this.userMedia.get(userId);
    if (!userMedia) return;

    if (userMedia.sendTransport && !userMedia.sendTransport.closed) {
      userMedia.sendTransport.close();
    }
    if (userMedia.recvTransport && !userMedia.recvTransport.closed) {
      userMedia.recvTransport.close();
    }

    this.userMedia.delete(userId);
  }

  private findTransport(
    userId: string,
    transportId: string
  ): WebRtcTransport | null {
    const userMedia = this.userMedia.get(userId);
    if (!userMedia) return null;

    if (userMedia.sendTransport?.id === transportId) {
      return userMedia.sendTransport;
    }
    if (userMedia.recvTransport?.id === transportId) {
      return userMedia.recvTransport;
    }
    return null;
  }
}
