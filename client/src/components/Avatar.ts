import { Container, Graphics, Text, TextStyle } from 'pixi.js';

const AVATAR_RADIUS = 20;
const NAMEPLATE_OFFSET = 30;

export class Avatar extends Container {
  private circle: Graphics;
  private proximityRing: Graphics;
  private speakingRing: Graphics;
  private nameplate: Text;
  private _targetX = 0;
  private _targetY = 0;
  private _inProximity = false;
  private _isSpeaking = false;
  private _speakingPulse = 0;
  public isLocal = false;

  constructor(username: string, color: string, isLocal = false) {
    super();
    this.isLocal = isLocal;

    // Avatar body (colored circle)
    this.circle = new Graphics();
    this.drawCircle(color, isLocal);
    this.addChild(this.circle);

    // Proximity voice indicator (green ring, initially hidden)
    this.proximityRing = new Graphics();
    this.proximityRing.lineStyle(2, 0x2ecc71, 0.6);
    this.proximityRing.drawCircle(0, 0, AVATAR_RADIUS + 6);
    this.proximityRing.visible = false;
    this.addChild(this.proximityRing);

    // Speaking indicator (pulsing yellow-orange ring, initially hidden)
    this.speakingRing = new Graphics();
    this.speakingRing.lineStyle(3, 0xf1c40f, 0.8);
    this.speakingRing.drawCircle(0, 0, AVATAR_RADIUS + 10);
    this.speakingRing.visible = false;
    this.addChild(this.speakingRing);

    // Nameplate
    this.nameplate = new Text(username, new TextStyle({
      fontSize: 14,
      fill: '#ffffff',
      fontFamily: 'Arial',
      align: 'center',
      dropShadow: true,
      dropShadowColor: '#000000',
      dropShadowDistance: 1,
      dropShadowBlur: 2,
    }));
    this.nameplate.anchor.set(0.5, 0);
    this.nameplate.y = NAMEPLATE_OFFSET;
    this.addChild(this.nameplate);
  }

  private drawCircle(color: string, isLocal: boolean) {
    this.circle.clear();

    // Outer ring for local player
    if (isLocal) {
      this.circle.lineStyle(3, 0xffffff, 0.8);
    }

    this.circle.beginFill(parseInt(color.replace('#', ''), 16));
    this.circle.drawCircle(0, 0, AVATAR_RADIUS);
    this.circle.endFill();
  }

  setTarget(x: number, y: number) {
    this._targetX = x;
    this._targetY = y;
  }

  interpolate(alpha: number) {
    if (this.isLocal) return; // Local player moves directly
    this.x += (this._targetX - this.x) * alpha;
    this.y += (this._targetY - this.y) * alpha;
  }

  setInProximity(inProximity: boolean): void {
    if (this._inProximity === inProximity) return;
    this._inProximity = inProximity;
    this.proximityRing.visible = inProximity;
  }

  setSpeaking(speaking: boolean): void {
    if (this._isSpeaking === speaking) return;
    this._isSpeaking = speaking;
    this.speakingRing.visible = speaking;
    if (!speaking) {
      this.speakingRing.alpha = 0.8;
      this._speakingPulse = 0;
    }
  }

  /**
   * Call each frame to animate the speaking indicator pulse.
   */
  updateSpeakingAnimation(delta: number): void {
    if (!this._isSpeaking) return;
    this._speakingPulse += delta * 0.1;
    // Pulse alpha between 0.4 and 1.0
    this.speakingRing.alpha = 0.7 + 0.3 * Math.sin(this._speakingPulse);
  }
}
