import type Phaser from 'phaser';
import type { Palette, SpriteData, SpriteFrame } from '../content/types';
import { parseFrame } from './parseSprite';

/** Draws frames side by side into one canvas texture, with numbered frames 0..n-1. */
export function createStripTexture(
  scene: Phaser.Scene,
  key: string,
  frames: readonly SpriteFrame[],
  palette: Palette,
): void {
  const first = frames[0];
  if (!first) throw new Error(`Texture "${key}" has no frames`);
  const width = first[0]?.length ?? 0;
  const height = first.length;
  const texture = scene.textures.createCanvas(key, width * frames.length, height);
  if (!texture) throw new Error(`Could not create texture "${key}"`);

  const context = texture.getContext();
  frames.forEach((frame, i) => {
    const pixels = parseFrame(frame, palette);
    context.putImageData(
      new ImageData(new Uint8ClampedArray(pixels.data), width, height),
      i * width,
      0,
    );
    texture.add(i, 0, i * width, 0, width, height);
  });
  texture.refresh();
}

export function animationKey(textureKey: string, name: string): string {
  return `${textureKey}:${name}`;
}

export function createSpriteTexture(scene: Phaser.Scene, key: string, sprite: SpriteData): void {
  createStripTexture(scene, key, sprite.frames, sprite.palette);
  for (const [name, anim] of Object.entries(sprite.animations)) {
    scene.anims.create({
      key: animationKey(key, name),
      frames: anim.frames.map((frame) => ({ key, frame })),
      frameRate: anim.frameRate,
      repeat: anim.repeat,
    });
  }
}
