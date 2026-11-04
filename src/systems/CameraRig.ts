import Phaser from 'phaser';
import { CAMERA } from '../config/constants';

interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * Makes the main camera follow a target smoothly, but only moves it on physics steps.
 *
 * Phaser's own lerped follow moves the camera on every rendered frame, while sprites
 * only move on fixed physics steps. On a screen faster than the physics rate (120 Hz
 * and up) the camera kept gliding while the player stood still, so the player shook
 * back and forth on screen, which looks like blur. Here the camera follows a focus
 * point that is smoothed once per physics step, so camera and sprites always move together.
 */
export class CameraRig {
  private readonly focus: Phaser.Math.Vector2;
  private pendingSteps = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly target: Point,
  ) {
    this.focus = new Phaser.Math.Vector2(target.x, target.y);
    const camera = scene.cameras.main;
    // The smoothing happens in `focus`, so the camera itself tracks it exactly.
    camera.startFollow(this.focus, true, 1, 1);
    camera.setDeadzone(CAMERA.deadzoneWidth, CAMERA.deadzoneHeight);

    const world = scene.physics.world;
    world.on(Phaser.Physics.Arcade.Events.WORLD_STEP, this.countStep, this);
    // Sprites are synced to their bodies in the physics post-update, which runs before this.
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.applySteps, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      world.off(Phaser.Physics.Arcade.Events.WORLD_STEP, this.countStep, this);
      scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.applySteps, this);
    });
  }

  /** The point the camera follows. It only changes on physics steps. */
  get focusPoint(): Phaser.Math.Vector2 {
    return this.focus;
  }

  private countStep(): void {
    this.pendingSteps++;
  }

  private applySteps(): void {
    for (; this.pendingSteps > 0; this.pendingSteps--) {
      this.focus.x = Phaser.Math.Linear(this.focus.x, this.target.x, CAMERA.lerp);
      this.focus.y = Phaser.Math.Linear(this.focus.y, this.target.y, CAMERA.lerp);
    }
  }
}
