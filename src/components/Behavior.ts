import type Phaser from 'phaser';
import type { EnemyDefinition } from '../content/types';

/** What a behaviour component may read and drive. */
export interface BehaviorHost {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  readonly body: Phaser.Physics.Arcade.Body;
  readonly definition: EnemyDefinition;
  readonly ground: Phaser.Tilemaps.TilemapLayer;
}

export interface Behavior {
  update(time: number, delta: number): void;
}
