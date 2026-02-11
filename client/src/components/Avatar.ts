import { Container, Graphics, Text, TextStyle } from 'pixi.js';

const AVATAR_RADIUS = 20;
const NAMEPLATE_OFFSET = 30;

export class Avatar extends Container {
  private circle: Graphics;
  private nameplate: Text;
  private _targetX = 0;
  private _targetY = 0;
  public isLocal = false;

  constructor(username: string, color: string, isLocal = false) {
    super();
    this.isLocal = isLocal;

    // Avatar body (colored circle)
    this.circle = new Graphics();
    this.drawCircle(color, isLocal);
    this.addChild(this.circle);

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
}
