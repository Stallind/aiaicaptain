import type { Palette, SpriteData, SpriteFrame } from '../content/types';

export interface PixelBuffer {
  readonly width: number;
  readonly height: number;
  /** RGBA, row-major, compatible with ImageData. */
  readonly data: Uint8ClampedArray;
}

const HEX_COLOR = /^#([0-9a-f]{6})$/i;

export function hexToRgb(hex: string): [number, number, number] {
  const match = HEX_COLOR.exec(hex);
  if (!match?.[1]) {
    throw new Error(`Invalid colour "${hex}", expected #rrggbb`);
  }
  const value = parseInt(match[1], 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

/** Returns a list of problems; an empty list means the frame is usable. */
export function validateFrame(frame: SpriteFrame, palette: Palette): string[] {
  const errors: string[] = [];
  const width = frame[0]?.length ?? 0;
  if (frame.length === 0 || width === 0) {
    return ['frame is empty'];
  }
  frame.forEach((row, y) => {
    if (row.length !== width) {
      errors.push(`row ${y} has length ${row.length}, expected ${width}`);
    }
    for (const char of row) {
      if (!(char in palette)) {
        errors.push(`row ${y} uses "${char}" which is not in the palette`);
      }
    }
  });
  return errors;
}

export function validateSprite(sprite: SpriteData): string[] {
  const errors: string[] = [];
  const first = sprite.frames[0];
  if (!first) {
    return ['sprite has no frames'];
  }
  sprite.frames.forEach((frame, i) => {
    for (const error of validateFrame(frame, sprite.palette)) {
      errors.push(`frame ${i}: ${error}`);
    }
    if (frame.length !== first.length || frame[0]?.length !== first[0]?.length) {
      errors.push(`frame ${i} differs in size from frame 0`);
    }
  });
  for (const [name, anim] of Object.entries(sprite.animations)) {
    for (const index of anim.frames) {
      if (index < 0 || index >= sprite.frames.length) {
        errors.push(`animation "${name}" refers to missing frame ${index}`);
      }
    }
  }
  return errors;
}

export function parseFrame(frame: SpriteFrame, palette: Palette): PixelBuffer {
  const errors = validateFrame(frame, palette);
  if (errors.length > 0) {
    throw new Error(`Invalid sprite frame: ${errors.join('; ')}`);
  }
  const height = frame.length;
  const width = frame[0]?.length ?? 0;
  const data = new Uint8ClampedArray(width * height * 4);
  frame.forEach((row, y) => {
    for (let x = 0; x < width; x++) {
      const colour = palette[row.charAt(x)];
      if (!colour) continue;
      const [r, g, b] = hexToRgb(colour);
      const i = (y * width + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  });
  return { width, height, data };
}
