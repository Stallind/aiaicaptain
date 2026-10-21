/** The part of the Web Storage API the game needs; lets tests pass a fake. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface GameStorage {
  getHighscore(): number;
  /** Stores the score if it beats the highscore. Returns true if it did. */
  submitScore(score: number): boolean;
}

const HIGHSCORE_KEY = 'aiaicaptain.highscore';

/**
 * Stored values are untrusted: the user can edit them, and on GitHub Pages every
 * project of the same account shares one origin (and so one localStorage).
 * Anything that isn't a non-negative safe integer is treated as 0.
 */
export function sanitizeScore(value: unknown): number {
  const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof number === 'number' && Number.isSafeInteger(number) && number >= 0 ? number : 0;
}

/** localStorage can be missing or throw (private mode, blocked cookies), so fall back to memory. */
export function createGameStorage(backend: KeyValueStore = detectBackend()): GameStorage {
  return {
    getHighscore: () => readScore(backend, HIGHSCORE_KEY),
    submitScore: (score) => {
      const clean = sanitizeScore(score);
      if (clean <= readScore(backend, HIGHSCORE_KEY)) return false;
      safeWrite(backend, HIGHSCORE_KEY, String(clean));
      return true;
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

function detectBackend(): KeyValueStore {
  try {
    const storage = globalThis.localStorage;
    const probe = `${HIGHSCORE_KEY}.probe`;
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return createMemoryStore();
  }
}

function readScore(backend: KeyValueStore, key: string): number {
  try {
    return sanitizeScore(backend.getItem(key));
  } catch {
    return 0;
  }
}

function safeWrite(backend: KeyValueStore, key: string, value: string): void {
  try {
    backend.setItem(key, value);
  } catch {
    // Quota exceeded or storage revoked: losing a highscore is acceptable.
  }
}
