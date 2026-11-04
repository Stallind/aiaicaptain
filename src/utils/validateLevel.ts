import type { CharacterKind, LevelDefinition } from '../content/types';
import { EMPTY_CHAR } from './asciiMap';

export interface LevelValidationContext {
  readonly tileChars: readonly string[];
  /** Tile characters the player can stand on. */
  readonly solidTileChars: readonly string[];
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
  if (!(Number.isFinite(level.gravity) && level.gravity > 0)) {
    errors.push(`gravity must be a positive number, got ${level.gravity}`);
  }
  if (level.layout.length === 0) errors.push('layout is empty');
  if (level.nextLevel === level.id) errors.push('nextLevel points to the level itself');
  else if (level.nextLevel !== null && !ctx.levelIds.has(level.nextLevel)) {
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
    errors.push(...unknownCharacters(row, y, level, ctx));
  });
  return errors;
}

/** One message per distinct unknown character in a row: where it first appears and how often. */
function unknownCharacters(
  row: string,
  y: number,
  level: LevelDefinition,
  ctx: LevelValidationContext,
): string[] {
  const seen = new Map<string, { firstColumn: number; count: number }>();
  [...row].forEach((char, x) => {
    const known = char === EMPTY_CHAR || ctx.tileChars.includes(char) || char in level.entities;
    if (known) return;
    const entry = seen.get(char);
    if (entry) entry.count += 1;
    else seen.set(char, { firstColumn: x, count: 1 });
  });
  return [...seen].map(([char, { firstColumn, count }]) => {
    const times = count > 1 ? ` (×${count})` : '';
    return `row ${y}, column ${firstColumn}: unknown character "${char}"${times}`;
  });
}

function validateSpawns(level: LevelDefinition, ctx: LevelValidationContext): string[] {
  const counts = new Map<CharacterKind, number>();
  const errors: string[] = [];
  level.layout.forEach((row, y) => {
    [...row].forEach((char, x) => {
      const id = level.entities[char];
      const kind = id === undefined ? undefined : ctx.characterKinds.get(id);
      if (!kind) return;
      counts.set(kind, (counts.get(kind) ?? 0) + 1);
      if (kind === 'player' && !hasGroundBelow(level, x, y, ctx)) {
        errors.push(`player spawn at row ${y}, column ${x} has no ground below it`);
      }
    });
  });
  if (counts.get('player') !== 1) {
    errors.push(`level needs exactly one player spawn, found ${counts.get('player') ?? 0}`);
  }
  if ((counts.get('goal') ?? 0) < 1) errors.push('level needs at least one goal');
  return errors;
}

/** A spawn above a pit would drop the player straight out of the level. */
function hasGroundBelow(
  level: LevelDefinition,
  x: number,
  y: number,
  ctx: LevelValidationContext,
): boolean {
  for (let below = y + 1; below < level.layout.length; below++) {
    if (ctx.solidTileChars.includes(level.layout[below]?.charAt(x) ?? '')) return true;
  }
  return false;
}
