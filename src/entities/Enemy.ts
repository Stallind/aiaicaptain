import Phaser from 'phaser';
import { DEPTH, ENTITY_FX } from '../config/constants';
import type { EnemyDefinition } from '../content/types';
import type { Behavior } from '../components/Behavior';
import { createBehavior } from '../components/createBehavior';
import { Health } from '../components/Health';
import { playIfExists, setupPhysicsSprite } from './physicsSprite';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  readonly health: Health;
  private readonly behaviors: readonly Behavior[];
  private readonly physicsBody: Phaser.Physics.Arcade.Body;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    readonly definition: EnemyDefinition,
    ground: Phaser.Tilemaps.TilemapLayer,
  ) {
    super(scene, x, y, definition.id, 0);
    this.physicsBody = setupPhysicsSprite(this, definition, DEPTH.enemies);
    this.health = new Health(definition.stats.health, 0);
    const host = { sprite: this, body: this.physicsBody, definition, ground };
    this.behaviors = definition.components.map((spec) => createBehavior(spec, host));
    playIfExists(this, definition.id, 'walk');
  }

  get bodyTop(): number {
    return this.physicsBody.top;
  }

  updateBehaviors(time: number, delta: number): void {
    for (const behavior of this.behaviors) behavior.update(time, delta);
  }

  /** Squashes and removes the enemy; it no longer collides once this is called. */
  defeat(): void {
    this.health.kill();
    this.disableBody(false, false);
    this.anims.stop();
    this.scene.tweens.add({
      targets: this,
      scaleY: ENTITY_FX.enemyDefeatScaleY,
      alpha: 0,
      duration: ENTITY_FX.enemyDefeatMs,
      onComplete: () => this.destroy(),
    });
  }
}
