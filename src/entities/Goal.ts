import Phaser from 'phaser';
import { DEPTH } from '../config/constants';
import type { GoalDefinition } from '../content/types';
import { playIfExists, setupPhysicsSprite } from './physicsSprite';

export class Goal extends Phaser.Physics.Arcade.Sprite {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    readonly definition: GoalDefinition,
  ) {
    super(scene, x, y, definition.id, 0);
    const body = setupPhysicsSprite(this, definition, DEPTH.pickups);
    body.setAllowGravity(false).setImmovable(true);
    playIfExists(this, definition.id, 'idle');
  }
}
