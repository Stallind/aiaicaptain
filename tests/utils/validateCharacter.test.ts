import { describe, expect, it } from 'vitest';
import type { EnemyDefinition, PlayerDefinition } from '../../src/content/types';
import { validateCharacter } from '../../src/utils/validateCharacter';

const limits = { maxTextureSize: 64, maxTaglineChars: 20 };
const sprite = {
  palette: { '.': null, x: '#ffffff' },
  frames: [['xx', 'xx']],
  animations: { idle: { frames: [0], frameRate: 1, repeat: -1 } },
};

const player: PlayerDefinition = {
  id: 'hero',
  kind: 'player',
  sprite,
  body: { width: 2, height: 2, offsetX: 0, offsetY: 0 },
  stats: { speed: 100, jumpVelocity: 300, health: 3 },
  displayName: 'Hero',
  tagline: 'Brave',
  portrait: { palette: sprite.palette, frame: ['x'] },
};

const enemy: EnemyDefinition = {
  id: 'rock',
  kind: 'enemy',
  sprite,
  body: { width: 2, height: 2, offsetX: 0, offsetY: 0 },
  stats: { speed: 0, jumpVelocity: 0, health: 1 },
  scoreValue: 10,
  stompable: true,
  components: [],
};

describe('validateCharacter', () => {
  it('accepts valid characters, including enemies that stand still', () => {
    expect(validateCharacter(player, limits)).toEqual([]);
    expect(validateCharacter(enemy, limits)).toEqual([]);
  });

  it('rejects health that would make a character unkillable', () => {
    const errors = validateCharacter({ ...player, stats: { ...player.stats, health: 0 } }, limits);
    expect(errors).toContain('health must be a whole number of at least 1, got 0');
  });

  it('requires players to move and jump', () => {
    const errors = validateCharacter(
      { ...player, stats: { speed: 0, jumpVelocity: -5, health: 3 } },
      limits,
    );
    expect(errors).toContain('speed must be positive, got 0');
    expect(errors).toContain('jumpVelocity must be positive, got -5');
  });

  it('rejects hitboxes outside the frame and strips wider than the texture limit', () => {
    const wide = { ...sprite, frames: Array.from({ length: 40 }, () => ['xx', 'xx']) };
    const errors = validateCharacter(
      { ...enemy, sprite: wide, body: { width: 3, height: 2, offsetX: 0, offsetY: 0 } },
      limits,
    );
    expect(errors.some((e) => e.includes('does not fit'))).toBe(true);
    expect(errors.some((e) => e.includes('sprite strip is 80px wide'))).toBe(true);
  });

  it('checks the select-screen texts and portrait', () => {
    const errors = validateCharacter(
      {
        ...player,
        displayName: ' ',
        tagline: 'a tagline that is far too long',
        portrait: { palette: sprite.palette, frame: ['?'] },
      },
      limits,
    );
    expect(errors).toContain('displayName is empty');
    expect(errors).toContain('tagline is 30 characters, max is 20');
    expect(errors.some((e) => e.startsWith('portrait:'))).toBe(true);
  });
});
