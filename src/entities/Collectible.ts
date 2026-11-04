import Phaser from 'phaser';
import { COLLECTIBLE_BOB, DEPTH, ENTITY_FX } from '../config/constants';
import type { CollectibleDefinition } from '../content/types';
import { playIfExists, setupPhysicsSprite } from './physicsSprite';

export class Collectible extends Phaser.Physics.Arcade.Sprite {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    readonly definition: CollectibleDefinition,
  ) {
    super(scene, x, y, definition.id, 0);
    const body = setupPhysicsSprite(this, definition, DEPTH.pickups);
    body.setAllowGravity(false).setImmovable(true);
    playIfExists(this, definition.id, 'idle');
    scene.tweens.add({
      targets: this,
      y: y - COLLECTIBLE_BOB.amplitude,
      duration: COLLECTIBLE_BOB.durationMs,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  collect(): void {
    this.disableBody(false, false);
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      y: this.y - ENTITY_FX.pickupRise,
      alpha: 0,
      duration: ENTITY_FX.pickupMs,
      onComplete: () => this.destroy(),
    });
  }
}
