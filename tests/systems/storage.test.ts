import { describe, expect, it } from 'vitest';
import { createGameStorage, createMemoryStore, sanitizeScore } from '../../src/systems/storage';
import type { KeyValueStore } from '../../src/systems/storage';

describe('createGameStorage', () => {
  it('starts at zero and keeps the best score', () => {
    const storage = createGameStorage(createMemoryStore());
    expect(storage.getHighscore()).toBe(0);
    expect(storage.submitScore(500)).toBe(true);
    expect(storage.submitScore(300)).toBe(false);
    expect(storage.getHighscore()).toBe(500);
  });

  it('survives a backend that throws', () => {
    const broken: KeyValueStore = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
    };
    const storage = createGameStorage(broken);
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
    expect(storage.submitScore(-100)).toBe(false);
    expect(store.getItem('aiaicaptain.highscore')).toBeNull();
  });
});
