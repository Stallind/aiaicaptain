import type { CharacterKind, LevelDefinition } from '../content/types';
import { EMPTY_CHAR } from './asciiMap';

export interface LevelValidationContext {
  readonly tileChars: readonly string[];
  /** Character id -> kind, for every registered character. */
  readonly characterKinds: ReadonlyMap<string, CharacterKind>;
  readonly levelIds: ReadonlySet<string>;
}

/** Returns a list of problems; an empty list means the level is playable. */
export function validateLevel(level: LevelDefinition, ctx: LevelValidationContext): string[] {
  return [
    ...validateBasics(level, ctx),
    ...validateLegend(level, ctx),
    ...validateLayout(level, ctx),
    ...validateSpawns(level, ctx),
  ];
}

function validateBasics(level: LevelDefinition, ctx: LevelValidationContext): string[] {
  const errors: string[] = [];
  if (!(level.gravity > 0)) errors.push(`gravity must be positive, got ${level.gravity}`);
  if (level.layout.length === 0) errors.push('layout is empty');
  if (level.nextLevel !== null && !ctx.levelIds.has(level.nextLevel)) {
    errors.push(`nextLevel "${level.nextLevel}" is not registered`);
  }
  return errors;
}

function validateLegend(level: LevelDefinition, ctx: LevelValidationContext): string[] {
  const errors: string[] = [];
  for (const [char, id] of Object.entries(level.entities)) {
    if (char.length !== 1) errors.push(`entity key "${char}" must be a single character`);
    if (char === EMPTY_CHAR || ctx.tileChars.includes(char)) {
      errors.push(`entity key "${char}" collides with a tile character`);
    }
    if (!ctx.characterKinds.has(id)) {
      errors.push(`entity "${char}" refers to unknown character "${id}"`);
    }
  }
  return errors;
}

function validateLayout(level: LevelDefinition, ctx: LevelValidationContext): string[] {
  const errors: string[] = [];
  const width = level.layout[0]?.length ?? 0;
  level.layout.forEach((row, y) => {
    if (row.length !== width) errors.push(`row ${y} has length ${row.length}, expected ${width}`);
    for (const char of row) {
      const known = char === EMPTY_CHAR || ctx.tileChars.includes(char) || char in level.entities;
      if (!known) errors.push(`row ${y} contains unknown character "${char}"`);
    }
  });
  return errors;
}

function validateSpawns(level: LevelDefinition, ctx: LevelValidationContext): string[] {
  const counts = new Map<CharacterKind, number>();
  for (const row of level.layout) {
    for (const char of row) {
      const id = level.entities[char];
      const kind = id === undefined ? undefined : ctx.characterKinds.get(id);
      if (kind) counts.set(kind, (counts.get(kind) ?? 0) + 1);
    }
  }
  const errors: string[] = [];
  if (counts.get('player') !== 1) {
    errors.push(`level needs exactly one player spawn, found ${counts.get('player') ?? 0}`);
  }
  if ((counts.get('goal') ?? 0) < 1) errors.push('level needs at least one goal');
  return errors;
}
