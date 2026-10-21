import { describe, expect, it } from 'vitest';
import type { CharacterKind, LevelDefinition } from '../../src/content/types';
import { validateLevel } from '../../src/utils/validateLevel';

const context = {
  tileChars: ['#'],
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

  it('rejects unknown layout characters and uneven rows', () => {
    const errors = validateLevel({ ...base, layout: ['P.xG', '###'] }, context);
    expect(errors).toContain('row 0 contains unknown character "x"');
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

  it('rejects bad gravity and unknown next level', () => {
    const errors = validateLevel({ ...base, gravity: 0, nextLevel: 'missing' }, context);
    expect(errors).toContain('gravity must be positive, got 0');
    expect(errors).toContain('nextLevel "missing" is not registered');
  });
});
