import { describe, expect, it } from 'vitest';
import {
  hexToRgb,
  parseFrame,
  validateFrame,
  validateSprite,
} from '../../src/graphics/parseSprite';

const palette = { '.': null, r: '#ff0000', b: '#0000ff' };

describe('hexToRgb', () => {
  it('parses #rrggbb', () => {
    expect(hexToRgb('#3a7bd5')).toEqual([0x3a, 0x7b, 0xd5]);
  });

  it('rejects other formats', () => {
    expect(() => hexToRgb('red')).toThrow();
    expect(() => hexToRgb('#fff')).toThrow();
  });
});

describe('validateFrame', () => {
  it('accepts a well-formed frame', () => {
    expect(validateFrame(['r.', '.b'], palette)).toEqual([]);
  });

  it('reports uneven rows and unknown characters', () => {
    const errors = validateFrame(['rr', 'r', 'x.'], palette);
    expect(errors).toHaveLength(2);
    expect(errors[0]).toContain('row 1');
    expect(errors[1]).toContain('"x"');
  });

  it('rejects empty frames', () => {
    expect(validateFrame([], palette)).toEqual(['frame is empty']);
  });
});

describe('validateSprite', () => {
  it('reports frames of different size and missing animation frames', () => {
    const errors = validateSprite({
      palette,
      frames: [['rr'], ['rrr']],
      animations: { idle: { frames: [0, 5], frameRate: 1, repeat: -1 } },
    });
    expect(errors).toEqual([
      'frame 1 differs in size from frame 0',
      'animation "idle" refers to missing frame 5',
    ]);
  });
});

describe('parseFrame', () => {
  it('produces RGBA pixels with transparency', () => {
    const buffer = parseFrame(['r.', '.b'], palette);
    expect(buffer.width).toBe(2);
    expect(buffer.height).toBe(2);
    expect(Array.from(buffer.data.slice(0, 4))).toEqual([255, 0, 0, 255]);
    expect(Array.from(buffer.data.slice(4, 8))).toEqual([0, 0, 0, 0]);
    expect(Array.from(buffer.data.slice(12, 16))).toEqual([0, 0, 255, 255]);
  });

  it('throws on invalid frames', () => {
    expect(() => parseFrame(['rx'], palette)).toThrow(/not in the palette/);
  });
});
