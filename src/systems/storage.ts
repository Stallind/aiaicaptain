import { AUDIO } from '../config/audio';
import { parseAudioSettings } from '../utils/audioSettings';
import type { AudioSettings } from '../utils/audioSettings';

/** The part of the Web Storage API the game needs; lets tests pass a fake. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface ScoreResult {
  /** The score beat the previous highscore. */
  readonly isRecord: boolean;
  /** The new highscore was written to persistent storage (false when storage is unavailable or full). */
  readonly saved: boolean;
}

export interface GameStorage {
  getHighscore(): number;
  submitScore(score: number): ScoreResult;
  /** The last chosen character id, or null. Callers must still check that it exists. */
  getSelectedCharacter(): string | null;
  setSelectedCharacter(id: string): void;
  /** Saved sound settings, or the defaults from config/audio.ts. */
  getAudioSettings(): AudioSettings;
  setAudioSettings(settings: AudioSettings): void;
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  music: AUDIO.musicVolume,
  effects: AUDIO.effectsVolume,
  muted: false,
};

const HIGHSCORE_KEY = 'aiaicaptain.highscore';
const CHARACTER_KEY = 'aiaicaptain.character';
const AUDIO_KEY = 'aiaicaptain.audio';
const PROBE_KEY = 'aiaicaptain.probe';
/** Ids are kebab-case; anything else in storage was not written by the game. */
const CHARACTER_ID_PATTERN = /^[a-z0-9-]{1,40}$/;

export function sanitizeCharacterId(value: unknown): string | null {
  return typeof value === 'string' && CHARACTER_ID_PATTERN.test(value) ? value : null;
}

/**
 * Stored values are untrusted: the user can edit them, and on GitHub Pages every
 * project of the same account shares one origin (and so one localStorage).
 * Anything that isn't a non-negative safe integer is treated as 0.
 */
export function sanitizeScore(value: unknown): number {
  const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof number === 'number' && Number.isSafeInteger(number) && number >= 0 ? number : 0;
}

/**
 * Wraps a backend in the game's rules. Create it once per game and share it
 * (see storageOf in sharedStorage.ts): when localStorage is unavailable the
 * fallback lives in memory, so a second instance would start empty.
 */
export function createGameStorage(backend: KeyValueStore = detectBackend()): GameStorage {
  return {
    getHighscore: () => readScore(backend),
    submitScore: (score) => {
      const clean = sanitizeScore(score);
      if (clean <= readScore(backend)) return { isRecord: false, saved: false };
      return { isRecord: true, saved: safeWrite(backend, HIGHSCORE_KEY, String(clean)) };
    },
    getSelectedCharacter: () => sanitizeCharacterId(safeRead(backend, CHARACTER_KEY)),
    setSelectedCharacter: (id) => {
      const clean = sanitizeCharacterId(id);
      if (clean) safeWrite(backend, CHARACTER_KEY, clean);
    },
    getAudioSettings: () =>
      parseAudioSettings(safeRead(backend, AUDIO_KEY), DEFAULT_AUDIO_SETTINGS),
    setAudioSettings: (settings) => {
      const clean = parseAudioSettings(JSON.stringify(settings), DEFAULT_AUDIO_SETTINGS);
      safeWrite(backend, AUDIO_KEY, JSON.stringify(clean));
    },
  };
}

export function createMemoryStore(): KeyValueStore {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

/**
 * For storage that can be read but not written (full quota, read-only policy):
 * keeps what's already saved readable, and holds new values in memory on top.
 */
export function createReadThroughStore(readable: KeyValueStore): KeyValueStore {
  const overlay = createMemoryStore();
  return {
    getItem: (key) => overlay.getItem(key) ?? safeRead(readable, key),
    setItem: (key, value) => overlay.setItem(key, value),
  };
}

/** Picks the best available backend; never throws. */
export function chooseBackend(storage: Storage | undefined): KeyValueStore {
  if (!storage || !canRead(storage)) return createMemoryStore();
  return canWrite(storage) ? storage : createReadThroughStore(storage);
}

function detectBackend(): KeyValueStore {
  try {
    return chooseBackend(globalThis.localStorage);
  } catch {
    // Merely touching localStorage throws when cookies are blocked.
    return createMemoryStore();
  }
}

function canRead(storage: Storage): boolean {
  try {
    storage.getItem(PROBE_KEY);
    return true;
  } catch {
    return false;
  }
}

function canWrite(storage: Storage): boolean {
  try {
    storage.setItem(PROBE_KEY, '1');
    storage.removeItem(PROBE_KEY);
    return true;
  } catch {
    return false;
  }
}

function readScore(backend: KeyValueStore): number {
  return sanitizeScore(safeRead(backend, HIGHSCORE_KEY));
}

function safeRead(backend: KeyValueStore, key: string): string | null {
  try {
    return backend.getItem(key);
  } catch {
    return null;
  }
}

/** Returns false when the value could not be stored (quota exceeded, storage revoked). */
function safeWrite(backend: KeyValueStore, key: string, value: string): boolean {
  try {
    backend.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
