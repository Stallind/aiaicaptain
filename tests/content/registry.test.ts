import { describe, expect, it } from 'vitest';
import {
  CHARACTERS,
  contentErrors,
  LEVELS,
  firstLevelId,
  getCharacter,
  getLevel,
  getPlayerCharacter,
  isPlayerCharacter,
  levelValidationContext,
  PLAYER_CHARACTERS,
  playerCharacterOf,
} from '../../src/content/registry';
import type { EnemyDefinition } from '../../src/content/types';
import { TILES, TILE_CHARS, TILE_PALETTE } from '../../src/content/tiles';
import { HEART_EMPTY_FRAME, HEART_FRAME, UI_PALETTE } from '../../src/content/hudIcons';
import { MAX_TEXTURE_SIZE, TILE_SIZE } from '../../src/config/constants';
import { CHARACTER_SELECT_LAYOUT } from '../../src/config/ui';
import { validateFrame, validateSprite } from '../../src/graphics/parseSprite';
import { validateLevel } from '../../src/utils/validateLevel';

const context = levelValidationContext();
const ENEMIES = CHARACTERS.filter((c): c is EnemyDefinition => c.kind === 'enemy');

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

  it('has unique ids and can be looked up', () => {
    expect(new Set(CHARACTERS.map((c) => c.id)).size).toBe(CHARACTERS.length);
    expect(getCharacter('ai-captain').kind).toBe('player');
    expect(() => getCharacter('nope')).toThrow();
  });

  // Enemies affected by gravity must never walk or jump into a hole.
  it.each(ENEMIES.map((e) => [e.id, e] as const))(
    '%s stays on its platform unless it flies',
    (_id, enemy) => {
      const flies = enemy.components.some((c) => c.type === 'flyer');
      for (const component of enemy.components) {
        if (component.type === 'patrol' && !flies) expect(component.turnAtLedges).toBe(true);
      }
    },
  );
});

describe('player characters', () => {
  it('offers at least two characters, including Oh Scarrr and the AI Captain', () => {
    expect(PLAYER_CHARACTERS.map((c) => c.displayName)).toEqual(
      expect.arrayContaining(['Oh Scarrr', 'AI Captain']),
    );
    expect(isPlayerCharacter('oh-scarrr')).toBe(true);
    expect(isPlayerCharacter('blob-alien')).toBe(false);
    expect(getPlayerCharacter('oh-scarrr').id).toBe('oh-scarrr');
    expect(() => getPlayerCharacter('blob-alien')).toThrow();
  });

  it.each(PLAYER_CHARACTERS.map((c) => [c.id, c] as const))(
    '%s has a name, tagline and valid portrait',
    (_id, player) => {
      expect(player.displayName.trim()).not.toBe('');
      expect(player.tagline.trim()).not.toBe('');
      expect(validateFrame(player.portrait.frame, player.portrait.palette)).toEqual([]);
    },
  );
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

describe('content checked at boot', () => {
  it('has no errors', () => {
    expect(
      contentErrors({
        maxTextureSize: MAX_TEXTURE_SIZE,
        maxTaglineChars: CHARACTER_SELECT_LAYOUT.maxTaglineChars,
      }),
    ).toEqual([]);
  });

  it('chains levels from the first to a final level without loops', () => {
    const visited = new Set<string>();
    let id: string | null = firstLevelId();
    while (id !== null) {
      expect(visited.has(id)).toBe(false);
      visited.add(id);
      id = getLevel(id).nextLevel;
    }
    expect(visited.size).toBe(LEVELS.length);
  });

  it('explains unknown ids and where to register them', () => {
    expect(() => getCharacter('nope')).toThrow(/Known: .*ai-captain.*src\/content\/registry\.ts/);
    expect(() => getLevel('nope')).toThrow(/Register it in LEVELS/);
  });
});
