import type Phaser from 'phaser';
import { createGameStorage } from './storage';
import type { GameStorage } from './storage';

const REGISTRY_KEY = 'storage';

function isGameStorage(value: unknown): value is GameStorage {
  return typeof value === 'object' && value !== null && 'getHighscore' in value;
}

/**
 * The game's one storage instance, kept in Phaser's game-wide registry so every
 * scene shares it. Created on first use.
 */
export function storageOf(scene: Phaser.Scene): GameStorage {
  const existing: unknown = scene.registry.get(REGISTRY_KEY);
  if (isGameStorage(existing)) return existing;
  const storage = createGameStorage();
  scene.registry.set(REGISTRY_KEY, storage);
  return storage;
}
