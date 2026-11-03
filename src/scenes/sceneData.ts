/**
 * Data passed between scenes on start/launch. Phaser types scene data as
 * `object`, so each scene parses what it receives and falls back to safe
 * defaults instead of crashing on a missing or malformed field.
 */
export interface GameSceneData {
  readonly levelId: string;
  readonly score: number;
  /** The chosen player character; carried from level to level. */
  readonly playerId: string;
}

/** What the game scene needs to check incoming data against the registry. */
export interface GameSceneDefaults {
  readonly isKnownLevel: (id: string) => boolean;
  readonly fallbackLevelId: string;
  readonly isKnownPlayer: (id: string) => boolean;
  readonly fallbackPlayerId: string;
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

function knownId(value: unknown, isKnown: (id: string) => boolean, fallback: string): string {
  return typeof value === 'string' && isKnown(value) ? value : fallback;
}

export function parseGameSceneData(data: unknown, defaults: GameSceneDefaults): GameSceneData {
  return {
    levelId: knownId(field(data, 'levelId'), defaults.isKnownLevel, defaults.fallbackLevelId),
    score: count(field(data, 'score')),
    playerId: knownId(field(data, 'playerId'), defaults.isKnownPlayer, defaults.fallbackPlayerId),
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
