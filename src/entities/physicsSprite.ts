import type Phaser from 'phaser';
import type { BaseCharacterDefinition } from '../content/types';
import { animationKey } from '../graphics/textureFactory';

/** Adds the sprite to the scene and physics world with feet at (x, y) and the definition's hitbox. */
export function setupPhysicsSprite(
  sprite: Phaser.Physics.Arcade.Sprite,
  definition: BaseCharacterDefinition,
  depth: number,
): Phaser.Physics.Arcade.Body {
  sprite.scene.add.existing(sprite);
  sprite.scene.physics.add.existing(sprite);
  // Origin (0.5, 1) puts (x, y) at the feet, matching the spawn points from the
  // level. Arcade body offsets are still measured from the frame's top-left
  // corner, not from the origin, so BodySpec offsets are in frame pixels.
  sprite.setOrigin(0.5, 1).setDepth(depth);
  const { width, height, offsetX, offsetY } = definition.body;
  sprite.setBodySize(width, height, false).setOffset(offsetX, offsetY);
  return sprite.body as Phaser.Physics.Arcade.Body;
}

/** Returns the animation key if the sprite defines that animation, so it can be cached. */
export function findAnimation(
  scene: Phaser.Scene,
  textureKey: string,
  name: string,
): string | null {
  const key = animationKey(textureKey, name);
  return scene.anims.exists(key) ? key : null;
}

/** For one-off calls (constructors, menus); per-frame code should cache findAnimation instead. */
export function playIfExists(
  sprite: Phaser.GameObjects.Sprite,
  textureKey: string,
  name: string,
): void {
  const key = findAnimation(sprite.scene, textureKey, name);
  if (key) sprite.play(key, true);
}
