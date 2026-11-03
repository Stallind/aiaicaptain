import type Phaser from 'phaser';
import { MAX_TEXTURE_SIZE } from '../config/constants';
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
  const { texture, context } = createCanvas(scene, key, width * frames.length, height);
  frames.forEach((frame, i) => {
    const pixels = parseFrameFor(key, i, frame, palette);
    if (pixels.width !== width || pixels.height !== height) {
      throw new Error(
        `Sprite "${key}", frame ${i}: ${pixels.width}×${pixels.height}, but frame 0 is ${width}×${height}`,
      );
    }
    context.putImageData(
      new ImageData(new Uint8ClampedArray(pixels.data), width, height),
      i * width,
      0,
    );
    texture.add(i, 0, i * width, 0, width, height);
  });
  texture.refresh();
}

interface CanvasTarget {
  readonly texture: Phaser.Textures.CanvasTexture;
  readonly context: CanvasRenderingContext2D;
}

function createCanvas(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
): CanvasTarget {
  if (scene.textures.exists(key)) {
    throw new Error(
      `Texture "${key}" already exists – are two characters registered with the same id?`,
    );
  }
  if (width > MAX_TEXTURE_SIZE || height > MAX_TEXTURE_SIZE) {
    throw new Error(
      `Texture "${key}" would be ${width}×${height}px; the limit is ${MAX_TEXTURE_SIZE}px – use fewer or smaller frames`,
    );
  }
  const texture = scene.textures.createCanvas(key, width, height);
  // getContext can return null when the browser runs out of canvas memory.
  const context: CanvasRenderingContext2D | null | undefined = texture?.getContext();
  if (!texture || !context) {
    throw new Error(
      `The browser refused to create a ${width}×${height}px canvas for texture "${key}"`,
    );
  }
  return { texture, context };
}

function parseFrameFor(key: string, index: number, frame: SpriteFrame, palette: Palette) {
  try {
    return parseFrame(frame, palette);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Sprite "${key}", frame ${index}: ${reason}`, { cause: error });
  }
}

export function animationKey(textureKey: string, name: string): string {
  return `${textureKey}:${name}`;
}

export function createSpriteTexture(scene: Phaser.Scene, key: string, sprite: SpriteData): void {
  createStripTexture(scene, key, sprite.frames, sprite.palette);
  for (const [name, anim] of Object.entries(sprite.animations)) {
    const animKey = animationKey(key, name);
    // Phaser silently keeps the first animation when a key is reused.
    if (scene.anims.exists(animKey)) throw new Error(`Animation "${animKey}" already exists`);
    scene.anims.create({
      key: animKey,
      frames: anim.frames.map((frame) => ({ key, frame })),
      frameRate: anim.frameRate,
      repeat: anim.repeat,
    });
  }
}
