import { describe, expect, it } from 'vitest';
import {
  chooseBackend,
  createGameStorage,
  createMemoryStore,
  createReadThroughStore,
  sanitizeScore,
} from '../../src/systems/storage';
import type { KeyValueStore } from '../../src/systems/storage';

const throwing = (): never => {
  throw new Error('denied');
};

/** A Web Storage stand-in; `writable: false` behaves like a full quota. */
function fakeStorage(initial: Record<string, string>, writable: boolean): Storage {
  const values = new Map(Object.entries(initial));
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    key: (i) => [...values.keys()][i] ?? null,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => (writable ? void values.set(key, value) : throwing()),
    removeItem: (key) => void values.delete(key),
  };
}

describe('createGameStorage', () => {
  it('starts at zero, keeps the best score and reports that it was saved', () => {
    const storage = createGameStorage(createMemoryStore());
    expect(storage.getHighscore()).toBe(0);
    expect(storage.submitScore(500)).toEqual({ isRecord: true, saved: true });
    expect(storage.submitScore(300)).toEqual({ isRecord: false, saved: false });
    expect(storage.getHighscore()).toBe(500);
  });

  it('reports a record that could not be saved', () => {
    const full: KeyValueStore = { getItem: () => null, setItem: throwing };
    expect(createGameStorage(full).submitScore(100)).toEqual({ isRecord: true, saved: false });
  });

  it('survives a backend that throws on every call', () => {
    const storage = createGameStorage({ getItem: throwing, setItem: throwing });
    expect(storage.getHighscore()).toBe(0);
    expect(() => storage.submitScore(100)).not.toThrow();
  });

  it('ignores corrupt values', () => {
    const store = createMemoryStore();
    store.setItem('aiaicaptain.highscore', 'banana');
    expect(createGameStorage(store).getHighscore()).toBe(0);
  });

  it('falls back to memory when localStorage is missing', () => {
    const storage = createGameStorage();
    storage.submitScore(42);
    expect(storage.getHighscore()).toBe(42);
  });
});

describe('chooseBackend', () => {
  it('uses working storage directly', () => {
    const storage = fakeStorage({}, true);
    expect(chooseBackend(storage)).toBe(storage);
  });

  it('keeps a saved highscore readable when storage can no longer be written', () => {
    const backend = chooseBackend(fakeStorage({ 'aiaicaptain.highscore': '900' }, false));
    const storage = createGameStorage(backend);
    expect(storage.getHighscore()).toBe(900);
    storage.setSelectedCharacter('oh-scarrr');
    expect(storage.getSelectedCharacter()).toBe('oh-scarrr');
  });

  it('falls back to memory when storage is missing', () => {
    const backend = chooseBackend(undefined);
    backend.setItem('a', '1');
    expect(backend.getItem('a')).toBe('1');
  });
});

describe('createReadThroughStore', () => {
  it('prefers newer in-memory values over the read-only originals', () => {
    const store = createReadThroughStore({ getItem: () => 'old', setItem: throwing });
    expect(store.getItem('k')).toBe('old');
    store.setItem('k', 'new');
    expect(store.getItem('k')).toBe('new');
  });
});

describe('sanitizeScore', () => {
  it('accepts non-negative integers as numbers or numeric strings', () => {
    expect(sanitizeScore(0)).toBe(0);
    expect(sanitizeScore(1200)).toBe(1200);
    expect(sanitizeScore('350')).toBe(350);
  });

  it('rejects tampered or malformed values', () => {
    for (const bad of [-5, 1.5, '1e308', Infinity, NaN, '', ' ', 'abc', null, undefined, {}]) {
      expect(sanitizeScore(bad)).toBe(0);
    }
  });

  it('does not store a tampered score', () => {
    const store = createMemoryStore();
    const storage = createGameStorage(store);
    expect(storage.submitScore(-100).isRecord).toBe(false);
    expect(store.getItem('aiaicaptain.highscore')).toBeNull();
  });
});

describe('selected character', () => {
  it('remembers the last choice', () => {
    const storage = createGameStorage(createMemoryStore());
    expect(storage.getSelectedCharacter()).toBeNull();
    storage.setSelectedCharacter('oh-scarrr');
    expect(storage.getSelectedCharacter()).toBe('oh-scarrr');
  });

  it('ignores values the game could not have written', () => {
    const store = createMemoryStore();
    store.setItem('aiaicaptain.character', '<script>');
    expect(createGameStorage(store).getSelectedCharacter()).toBeNull();
    createGameStorage(store).setSelectedCharacter('Not An Id!');
    expect(store.getItem('aiaicaptain.character')).toBe('<script>');
  });
});
