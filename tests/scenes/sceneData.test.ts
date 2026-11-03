import { describe, expect, it } from 'vitest';
import {
  parseGameOverSceneData,
  parseGameSceneData,
  parseHudSceneData,
} from '../../src/scenes/sceneData';

const defaults = {
  isKnownLevel: (id: string) => id === 'moon',
  fallbackLevelId: 'start',
  isKnownPlayer: (id: string) => id === 'hero',
  fallbackPlayerId: 'default-hero',
};

describe('parseGameSceneData', () => {
  it('keeps valid data', () => {
    expect(parseGameSceneData({ levelId: 'moon', score: 40, playerId: 'hero' }, defaults)).toEqual({
      levelId: 'moon',
      score: 40,
      playerId: 'hero',
    });
  });

  it('falls back for missing, unknown or malformed fields', () => {
    expect(parseGameSceneData(undefined, defaults)).toEqual({
      levelId: 'start',
      score: 0,
      playerId: 'default-hero',
    });
    expect(
      parseGameSceneData({ levelId: 'mars', score: -5, playerId: 'villain' }, defaults),
    ).toEqual({ levelId: 'start', score: 0, playerId: 'default-hero' });
    expect(parseGameSceneData({ levelId: 7, score: 1.5 }, defaults).score).toBe(0);
  });
});

describe('parseHudSceneData', () => {
  it('defaults every field', () => {
    expect(parseHudSceneData(null)).toEqual({ levelName: '', score: 0, health: 0, maxHealth: 0 });
  });
});

describe('parseGameOverSceneData', () => {
  it('only treats a literal true as a win', () => {
    expect(parseGameOverSceneData({ won: 'yes', score: 10, levelName: 'X' })).toEqual({
      won: false,
      score: 10,
      levelName: 'X',
    });
  });
});
