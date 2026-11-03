import { aiCaptain } from './characters/aiCaptain';
import { blobAlien } from './characters/blobAlien';
import { hopper } from './characters/hopper';
import { ohScarrr } from './characters/ohScarrr';
import { energyCell, starPickup } from './characters/pickups';
import { spaceJelly } from './characters/spaceJelly';
import { warpGate } from './characters/warpGate';
import { asteroidBelt } from './levels/01-asteroidBelt';
import { lunarOutpost } from './levels/02-lunarOutpost';
import { gasGiantRig } from './levels/03-gasGiantRig';
import { TILES, TILE_CHARS } from './tiles';
import type { CharacterDefinition, LevelDefinition, PlayerDefinition } from './types';
import { validateCharacter } from '../utils/validateCharacter';
import type { CharacterLimits } from '../utils/validateCharacter';
import type { LevelValidationContext } from '../utils/validateLevel';

// To add content: create a file under characters/ or levels/ and list it here.
// Player characters appear on the select screen in this order.
export const CHARACTERS: readonly CharacterDefinition[] = [
  aiCaptain,
  ohScarrr,
  blobAlien,
  hopper,
  spaceJelly,
  starPickup,
  energyCell,
  warpGate,
];

/** The first entry is where a new game starts. */
export const LEVELS: readonly LevelDefinition[] = [asteroidBelt, lunarOutpost, gasGiantRig];

const charactersById: ReadonlyMap<string, CharacterDefinition> = new Map(
  CHARACTERS.map((c) => [c.id, c]),
);
const levelsById: ReadonlyMap<string, LevelDefinition> = new Map(LEVELS.map((l) => [l.id, l]));

export function getCharacter(id: string): CharacterDefinition {
  const character = charactersById.get(id);
  if (!character) throw unknownId('character', id, [...charactersById.keys()], 'CHARACTERS');
  return character;
}

export function getLevel(id: string): LevelDefinition {
  const level = levelsById.get(id);
  if (!level) throw unknownId('level', id, [...levelsById.keys()], 'LEVELS');
  return level;
}

/** Every selectable player character, in registry order. */
export const PLAYER_CHARACTERS: readonly PlayerDefinition[] = CHARACTERS.filter(
  (c): c is PlayerDefinition => c.kind === 'player',
);

export function isPlayerCharacter(id: string): boolean {
  return PLAYER_CHARACTERS.some((c) => c.id === id);
}

export function getPlayerCharacter(id: string): PlayerDefinition {
  const character = PLAYER_CHARACTERS.find((c) => c.id === id);
  if (!character) {
    const ids = PLAYER_CHARACTERS.map((c) => c.id);
    throw unknownId('player character', id, ids, "CHARACTERS (with kind: 'player')");
  }
  return character;
}

/** The player character a level spawns by default (when nothing was chosen). */
export function playerCharacterOf(level: LevelDefinition): PlayerDefinition {
  for (const id of Object.values(level.entities)) {
    const character = charactersById.get(id);
    if (character?.kind === 'player') return character;
  }
  throw new Error(
    `Level "${level.id}" has no player character – map a player id in its entities legend`,
  );
}

export function firstLevelId(): string {
  const first = LEVELS[0];
  if (!first)
    throw new Error('No levels registered – add one to LEVELS in src/content/registry.ts');
  return first.id;
}

export function hasLevel(id: string): boolean {
  return levelsById.has(id);
}

/** What validateLevel needs to know about the registered content; shared by tests and runtime. */
export function levelValidationContext(): LevelValidationContext {
  return {
    tileChars: TILE_CHARS,
    solidTileChars: TILES.filter((t) => t.solid).map((t) => t.char),
    characterKinds: new Map(CHARACTERS.map((c) => [c.id, c.kind])),
    levelIds: new Set(levelsById.keys()),
  };
}

/**
 * Everything wrong with the registered characters, as readable messages. Run at
 * boot (a broken character stops the game with a clear error instead of failing
 * somewhere later) and in the tests.
 */
export function contentErrors(limits: CharacterLimits): string[] {
  const errors: string[] = [];
  if (PLAYER_CHARACTERS.length === 0) {
    errors.push(
      "No player characters registered – add one with kind: 'player' to CHARACTERS in src/content/registry.ts",
    );
  }
  if (charactersById.size !== CHARACTERS.length) errors.push('Two characters share the same id');
  for (const character of CHARACTERS) {
    for (const error of validateCharacter(character, limits)) {
      errors.push(`Character "${character.id}": ${error}`);
    }
  }
  return errors;
}

/** Says what exists and where to register, so a typo or a missing registration is easy to fix. */
function unknownId(what: string, id: string, known: readonly string[], list: string): Error {
  return new Error(
    `Unknown ${what} "${id}". Known: ${known.join(', ') || 'none'}. ` +
      `Register it in ${list} in src/content/registry.ts.`,
  );
}
