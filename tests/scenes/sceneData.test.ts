import { describe, expect, it } from 'vitest';
import {
  parseGameOverSceneData,
  parseGameSceneData,
  parseHudSceneData,
} from '../../src/scenes/sceneData';

const isKnown = (id: string) => id === 'moon';

describe('parseGameSceneData', () => {
  it('keeps valid data', () => {
    expect(parseGameSceneData({ levelId: 'moon', score: 40 }, isKnown, 'start')).toEqual({
      levelId: 'moon',
      score: 40,
    });
  });

  it('falls back for missing, unknown or malformed fields', () => {
    expect(parseGameSceneData(undefined, isKnown, 'start')).toEqual({ levelId: 'start', score: 0 });
    expect(parseGameSceneData({ levelId: 'mars', score: -5 }, isKnown, 'start')).toEqual({
      levelId: 'start',
      score: 0,
    });
    expect(parseGameSceneData({ levelId: 7, score: 1.5 }, isKnown, 'start').score).toBe(0);
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
