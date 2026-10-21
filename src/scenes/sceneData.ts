/**
 * Data passed between scenes on start/launch. Phaser types scene data as
 * `object`, so each scene parses what it receives and falls back to safe
 * defaults instead of crashing on a missing or malformed field.
 */
export interface GameSceneData {
  readonly levelId: string;
  readonly score: number;
}

export interface HudSceneData {
  readonly levelName: string;
  readonly score: number;
  readonly health: number;
  readonly maxHealth: number;
}

export interface GameOverSceneData {
  readonly won: boolean;
  readonly score: number;
  readonly levelName: string;
}

function field(data: unknown, key: string): unknown {
  return typeof data === 'object' && data !== null
    ? (data as Record<string, unknown>)[key]
    : undefined;
}

function count(value: unknown): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

function text(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

export function parseGameSceneData(
  data: unknown,
  isKnownLevel: (id: string) => boolean,
  fallbackLevelId: string,
): GameSceneData {
  const levelId = field(data, 'levelId');
  return {
    levelId: typeof levelId === 'string' && isKnownLevel(levelId) ? levelId : fallbackLevelId,
    score: count(field(data, 'score')),
  };
}

export function parseHudSceneData(data: unknown): HudSceneData {
  return {
    levelName: text(field(data, 'levelName'), ''),
    score: count(field(data, 'score')),
    health: count(field(data, 'health')),
    maxHealth: count(field(data, 'maxHealth')),
  };
}

export function parseGameOverSceneData(data: unknown): GameOverSceneData {
  return {
    won: field(data, 'won') === true,
    score: count(field(data, 'score')),
    levelName: text(field(data, 'levelName'), ''),
  };
}
