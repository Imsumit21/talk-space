import { useGameStore } from '../store/useGameStore';

interface SpatialAudioNode {
  source: MediaStreamAudioSourceNode;
  analyser: AnalyserNode;
  panner: PannerNode;
  gain: GainNode;
}

const SPEAKING_THRESHOLD = 30; // Byte frequency average threshold for speech detection
const ANALYSER_FFT_SIZE = 256;
const NOTIFICATION_COOLDOWN_MS = 500;

class SpatialAudioService {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private audioNodes = new Map<string, SpatialAudioNode>();
  private analyserBuffers = new Map<string, Uint8Array<ArrayBuffer>>();
  private lastNotificationTime = 0;

  /**
   * Initialize AudioContext. Must be called during a user gesture (click/tap)
   * to satisfy browser autoplay policy.
   */
  initialize(): boolean {
    if (this.audioContext) return true;

    try {
      this.audioContext = new AudioContext();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = useGameStore.getState().masterVolume;
      this.masterGain.connect(this.audioContext.destination);

      useGameStore.getState().setAudioInitialized(true);
      return true;
    } catch (err) {
      console.error('Failed to create AudioContext:', err);
      return false;
    }
  }

  /**
   * Resume AudioContext after user gesture (required by autoplay policy).
   */
  async resume(): Promise<void> {
    if (!this.audioContext) {
      this.initialize();
    }
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Add a remote user's audio stream to the spatial audio graph.
   * Chain: source → analyser → panner → masterGain → destination
   */
  addStream(userId: string, stream: MediaStream): void {
    if (!this.audioContext || !this.masterGain) {
      console.warn('AudioContext not initialized, cannot add stream');
      return;
    }

    // Remove existing if re-adding
    this.removeStream(userId);

    const source = this.audioContext.createMediaStreamSource(stream);

    // AnalyserNode for speaking detection
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = ANALYSER_FFT_SIZE;
    analyser.smoothingTimeConstant = 0.5;

    // PannerNode for spatial positioning
    const panner = this.audioContext.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 100;
    panner.maxDistance = 500;
    panner.rolloffFactor = 1.0;
    panner.coneInnerAngle = 360;
    panner.coneOuterAngle = 360;
    panner.coneOuterGain = 1;

    // Per-user gain (for future per-user volume control)
    const gain = this.audioContext.createGain();
    gain.gain.value = 1.0;

    // Connect chain: source → analyser → panner → gain → masterGain
    source.connect(analyser);
    analyser.connect(panner);
    panner.connect(gain);
    gain.connect(this.masterGain);

    this.audioNodes.set(userId, { source, analyser, panner, gain });
    this.analyserBuffers.set(userId, new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>);
  }

  /**
   * Remove a remote user's audio from the spatial graph.
   */
  removeStream(userId: string): void {
    const nodes = this.audioNodes.get(userId);
    if (!nodes) return;

    try {
      nodes.source.disconnect();
      nodes.analyser.disconnect();
      nodes.panner.disconnect();
      nodes.gain.disconnect();
    } catch {
      // Nodes may already be disconnected
    }

    this.audioNodes.delete(userId);
    this.analyserBuffers.delete(userId);
  }

  /**
   * Update the listener position (local player's ears).
   * Maps 2D game coords to 3D audio: gameX → audioX, gameY → audioZ.
   */
  updateListenerPosition(x: number, y: number): void {
    if (!this.audioContext) return;
    const listener = this.audioContext.listener;

    if (listener.positionX !== undefined) {
      listener.positionX.value = x;
      listener.positionY.value = 0;
      listener.positionZ.value = y;
    } else {
      // Fallback for older browsers
      listener.setPosition(x, 0, y);
    }
  }

  /**
   * Update a remote user's audio source position.
   * Maps 2D game coords to 3D audio: gameX → audioX, gameY → audioZ.
   */
  updateSourcePosition(userId: string, x: number, y: number): void {
    const nodes = this.audioNodes.get(userId);
    if (!nodes) return;

    const { panner } = nodes;
    if (panner.positionX !== undefined) {
      panner.positionX.value = x;
      panner.positionY.value = 0;
      panner.positionZ.value = y;
    } else {
      panner.setPosition(x, 0, y);
    }
  }

  /**
   * Set master volume (0-1).
   */
  setMasterVolume(volume: number): void {
    if (!this.masterGain || !this.audioContext) return;
    const clamped = Math.max(0, Math.min(1, volume));
    this.masterGain.gain.setValueAtTime(clamped, this.audioContext.currentTime);
  }

  /**
   * Check if a specific user is currently speaking.
   */
  isSpeaking(userId: string): boolean {
    const nodes = this.audioNodes.get(userId);
    const buffer = this.analyserBuffers.get(userId);
    if (!nodes || !buffer) return false;

    nodes.analyser.getByteFrequencyData(buffer);

    // Compute average level across frequency bins
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i];
    }
    const average = sum / buffer.length;

    return average > SPEAKING_THRESHOLD;
  }

  /**
   * Get set of user IDs that are currently speaking.
   * Call once per frame for efficiency.
   */
  getSpeakingUsers(): Set<string> {
    const speaking = new Set<string>();
    for (const userId of this.audioNodes.keys()) {
      if (this.isSpeaking(userId)) {
        speaking.add(userId);
      }
    }
    return speaking;
  }

  /**
   * Play a short notification "ding" sound for proximity enter.
   * Generated programmatically — no external audio file needed.
   */
  playNotificationSound(): void {
    if (!this.audioContext || !this.masterGain) return;
    if (this.audioContext.state !== 'running') return;

    // Cooldown to prevent stacking when multiple users enter simultaneously
    const wallTime = performance.now();
    if (wallTime - this.lastNotificationTime < NOTIFICATION_COOLDOWN_MS) return;
    this.lastNotificationTime = wallTime;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Create a pleasant two-tone "ding"
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const envelope = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1320, now); // E6 (perfect fifth)

    // Envelope: quick attack, short sustain, smooth decay
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(0.15, now + 0.02);
    envelope.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc1.connect(envelope);
    osc2.connect(envelope);
    envelope.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.3);
    osc2.stop(now + 0.3);

    // Cleanup after sound finishes
    osc1.onended = () => {
      osc1.disconnect();
      osc2.disconnect();
      envelope.disconnect();
    };
  }

  /**
   * Full cleanup of all audio resources.
   */
  cleanup(): void {
    for (const userId of [...this.audioNodes.keys()]) {
      this.removeStream(userId);
    }

    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    useGameStore.getState().setAudioInitialized(false);
    useGameStore.getState().setSpeakingUsers(new Set());
  }
}

// Singleton instance
export const spatialAudio = new SpatialAudioService();
