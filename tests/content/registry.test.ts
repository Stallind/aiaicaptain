import { describe, expect, it } from 'vitest';
import {
  CHARACTERS,
  LEVELS,
  firstLevelId,
  getCharacter,
  getLevel,
  levelValidationContext,
  playerCharacterOf,
} from '../../src/content/registry';
import { TILES, TILE_CHARS, TILE_PALETTE } from '../../src/content/tiles';
import { HEART_EMPTY_FRAME, HEART_FRAME, UI_PALETTE } from '../../src/content/hudIcons';
import { TILE_SIZE } from '../../src/config/constants';
import { validateFrame, validateSprite } from '../../src/graphics/parseSprite';
import { validateLevel } from '../../src/utils/validateLevel';

const context = levelValidationContext();

describe('registered levels', () => {
  it.each(LEVELS.map((l) => [l.id, l] as const))('%s is valid', (_id, level) => {
    expect(validateLevel(level, context)).toEqual([]);
  });

  it('has unique ids', () => {
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(LEVELS.length);
  });

  it('spawns the registered player character', () => {
    for (const level of LEVELS) expect(playerCharacterOf(level).kind).toBe('player');
  });

  it('can be looked up', () => {
    expect(getLevel(firstLevelId()).id).toBe(LEVELS[0]?.id);
    expect(() => getLevel('nope')).toThrow();
  });
});

describe('registered characters', () => {
  it.each(CHARACTERS.map((c) => [c.id, c] as const))('%s has a valid sprite', (_id, character) => {
    expect(validateSprite(character.sprite)).toEqual([]);
  });

  it.each(CHARACTERS.map((c) => [c.id, c] as const))('%s body fits its frame', (_id, c) => {
    const frame = c.sprite.frames[0] ?? [];
    expect(c.body.offsetX + c.body.width).toBeLessThanOrEqual(frame[0]?.length ?? 0);
    expect(c.body.offsetY + c.body.height).toBeLessThanOrEqual(frame.length);
  });

  it('has unique ids and exactly one player definition per id', () => {
    expect(new Set(CHARACTERS.map((c) => c.id)).size).toBe(CHARACTERS.length);
    expect(getCharacter('captain').kind).toBe('player');
    expect(() => getCharacter('nope')).toThrow();
  });
});

describe('tiles and ui sprites', () => {
  it.each(TILES.map((t) => [t.char, t] as const))(
    'tile "%s" is a valid tile-sized frame',
    (_c, tile) => {
      expect(validateFrame(tile.frame, TILE_PALETTE)).toEqual([]);
      expect(tile.frame.length).toBe(TILE_SIZE);
      expect(tile.frame[0]?.length).toBe(TILE_SIZE);
    },
  );

  it('uses unique tile characters', () => {
    expect(new Set(TILE_CHARS).size).toBe(TILE_CHARS.length);
  });

  it('has valid heart frames', () => {
    expect(validateFrame(HEART_FRAME, UI_PALETTE)).toEqual([]);
    expect(validateFrame(HEART_EMPTY_FRAME, UI_PALETTE)).toEqual([]);
  });
});
