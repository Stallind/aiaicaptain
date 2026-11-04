import { describe, expect, it } from 'vitest';
import type { CharacterKind, LevelDefinition } from '../../src/content/types';
import { validateLevel } from '../../src/utils/validateLevel';

const context = {
  tileChars: ['#', '-'],
  solidTileChars: ['#'],
  characterKinds: new Map<string, CharacterKind>([
    ['hero', 'player'],
    ['exit', 'goal'],
  ]),
  levelIds: new Set(['test', 'next']),
};

const base: LevelDefinition = {
  id: 'test',
  name: 'Test',
  gravity: 900,
  background: { color: '#000000', starSeed: 1, starDensity: 1 },
  entities: { P: 'hero', G: 'exit' },
  layout: ['P..G', '####'],
  nextLevel: 'next',
};

describe('validateLevel', () => {
  it('accepts a valid level', () => {
    expect(validateLevel(base, context)).toEqual([]);
  });

  it('requires exactly one player and at least one goal', () => {
    const errors = validateLevel({ ...base, layout: ['P.P.', '####'] }, context);
    expect(errors).toContain('level needs exactly one player spawn, found 2');
    expect(errors).toContain('level needs at least one goal');
  });

  it('reports each unknown character once per row, with column and count', () => {
    const errors = validateLevel({ ...base, layout: ['PxxG', '##y'] }, context);
    expect(errors).toContain('row 0, column 1: unknown character "x" (×2)');
    expect(errors).toContain('row 1, column 2: unknown character "y"');
    expect(errors).toContain('row 1 has length 3, expected 4');
  });

  it('rejects unknown characters and legend collisions', () => {
    const errors = validateLevel(
      { ...base, entities: { ...base.entities, '#': 'ghost' } },
      context,
    );
    expect(errors).toContain('entity key "#" collides with a tile character');
    expect(errors).toContain('entity "#" refers to unknown character "ghost"');
  });

  it('rejects zero, negative and infinite gravity', () => {
    for (const gravity of [0, -1, Infinity, NaN]) {
      expect(validateLevel({ ...base, gravity }, context)).toContain(
        `gravity must be a positive number, got ${gravity}`,
      );
    }
  });

  it('rejects an unknown next level and a level that leads to itself', () => {
    expect(validateLevel({ ...base, nextLevel: 'missing' }, context)).toContain(
      'nextLevel "missing" is not registered',
    );
    expect(validateLevel({ ...base, nextLevel: 'test' }, context)).toContain(
      'nextLevel points to the level itself',
    );
  });

  it('rejects a player spawn above a pit, even with a non-solid tile below', () => {
    const errors = validateLevel({ ...base, layout: ['P..G', '-...', '.###'] }, context);
    expect(errors).toContain('player spawn at row 0, column 0 has no ground below it');
  });
});
