import type Phaser from 'phaser';
import { COLORS } from './palette';
import { createRng, generateStars } from '../utils/random';

const PIXELS_PER_DENSITY_UNIT = 1000;

/** Draws a repeatable star texture; used with TileSprites for parallax. */
export function createStarfieldTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  density: number,
  seed: number,
): void {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const texture = scene.textures.createCanvas(key, width, height);
  // getContext can return null when the browser runs out of canvas memory.
  const context: CanvasRenderingContext2D | null | undefined = texture?.getContext();
  if (!texture || !context) {
    throw new Error(`The browser refused to create a ${width}×${height}px canvas for "${key}"`);
  }
  const count = Math.round((width * height * density) / PIXELS_PER_DENSITY_UNIT);
  for (const star of generateStars(count, width, height, createRng(seed))) {
    context.globalAlpha = star.brightness;
    context.fillStyle = star.size === 2 ? COLORS.cyanLight : COLORS.white;
    context.fillRect(star.x, star.y, star.size, star.size);
  }
  context.globalAlpha = 1;
  texture.refresh();
}
