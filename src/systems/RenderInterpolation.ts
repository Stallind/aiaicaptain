import Phaser from 'phaser';
import { PositionHistory, stepAlpha } from '../utils/interpolation';

interface Movable {
  x: number;
  y: number;
}

interface Tracked {
  readonly object: Movable;
  readonly isLive: () => boolean;
  readonly history: PositionHistory;
  /** Where this system last drew the object; anything else means something moved it. */
  drawnX: number;
  drawnY: number;
}

/**
 * Draws tracked objects between their last two physics positions, so motion is
 * smooth on screens faster than the physics rate (see utils/interpolation).
 *
 * The drawn position is only set after physics and game logic have run, and the
 * true physics position is put back at the start of the next frame, before Arcade
 * reads sprite positions into the bodies. Game logic never sees the drawn position.
 *
 * Code that moves a tracked object directly (setPosition, body.reset) is respected:
 * the new position is taken as a jump, drawn as is, and not smoothed or undone.
 *
 * Construct this after anything else that moves tracked objects in POST_UPDATE
 * (such as CameraRig), because listeners run in the order they were added.
 */
export class RenderInterpolation {
  private readonly tracked: Tracked[] = [];
  private stepped = false;

  constructor(private readonly scene: Phaser.Scene) {
    const world = scene.physics.world;
    const events = scene.events;
    world.on(Phaser.Physics.Arcade.Events.WORLD_STEP, this.onStep, this);
    events.on(Phaser.Scenes.Events.PRE_UPDATE, this.restore, this);
    events.on(Phaser.Scenes.Events.POST_UPDATE, this.interpolate, this);
    events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      world.off(Phaser.Physics.Arcade.Events.WORLD_STEP, this.onStep, this);
      events.off(Phaser.Scenes.Events.PRE_UPDATE, this.restore, this);
      events.off(Phaser.Scenes.Events.POST_UPDATE, this.interpolate, this);
    });
  }

  /** Track a physics sprite while it is active and its body is enabled. */
  trackSprite(sprite: Phaser.Physics.Arcade.Sprite): void {
    this.track(sprite, () => sprite.active && sprite.body?.enable === true);
  }

  /** Track any point that only changes on physics steps, such as a camera focus. */
  track(object: Movable, isLive: () => boolean = () => true): void {
    const history = new PositionHistory(object.x, object.y);
    this.tracked.push({ object, isLive, history, drawnX: object.x, drawnY: object.y });
  }

  private onStep(): void {
    this.stepped = true;
  }

  private restore(): void {
    for (const entry of this.tracked) {
      const { object, history } = entry;
      if (!entry.isLive()) continue;
      if (object.x !== entry.drawnX || object.y !== entry.drawnY) {
        history.jumpTo(object.x, object.y);
        continue;
      }
      object.x = history.x;
      object.y = history.y;
    }
  }

  private interpolate(): void {
    const alpha = stepAlpha(this.unsimulatedMs(), 1000 / this.scene.physics.world.fps);
    // Objects that stopped (a defeated enemy fading out) are left to their tweens.
    for (let i = this.tracked.length - 1; i >= 0; i--) {
      const entry = this.tracked[i];
      if (!entry) continue;
      if (!entry.isLive()) {
        this.tracked.splice(i, 1);
        continue;
      }
      const { object, history } = entry;
      if (this.stepped) history.record(object.x, object.y);
      else if (object.x !== history.x || object.y !== history.y) history.jumpTo(object.x, object.y);
      object.x = history.interpolatedX(alpha);
      object.y = history.interpolatedY(alpha);
      entry.drawnX = object.x;
      entry.drawnY = object.y;
    }
    this.stepped = false;
  }

  /**
   * Time Arcade has accumulated toward its next step. It is not public API, so the
   * value is checked; without it, alpha is 1 and objects are drawn at their physics
   * position, exactly as without interpolation.
   */
  private unsimulatedMs(): number {
    const elapsed: unknown = Reflect.get(this.scene.physics.world, '_elapsed');
    return typeof elapsed === 'number' ? elapsed : Number.NaN;
  }
}
