import { blobAlien } from './characters/blobAlien';
import { captain } from './characters/captain';
import { hopper } from './characters/hopper';
import { energyCell, starPickup } from './characters/pickups';
import { spaceJelly } from './characters/spaceJelly';
import { warpGate } from './characters/warpGate';
import { asteroidBelt } from './levels/01-asteroidBelt';
import { lunarOutpost } from './levels/02-lunarOutpost';
import { gasGiantRig } from './levels/03-gasGiantRig';
import { TILE_CHARS } from './tiles';
import type { CharacterDefinition, LevelDefinition, PlayerDefinition } from './types';
import type { LevelValidationContext } from '../utils/validateLevel';

// To add content: create a file under characters/ or levels/ and list it here.
export const CHARACTERS: readonly CharacterDefinition[] = [
  captain,
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
  if (!character) throw new Error(`Unknown character "${id}"`);
  return character;
}

export function getLevel(id: string): LevelDefinition {
  const level = levelsById.get(id);
  if (!level) throw new Error(`Unknown level "${id}"`);
  return level;
}

/** The character a level spawns as the player. */
export function playerCharacterOf(level: LevelDefinition): PlayerDefinition {
  for (const id of Object.values(level.entities)) {
    const character = charactersById.get(id);
    if (character?.kind === 'player') return character;
  }
  throw new Error(`Level "${level.id}" has no player character`);
}

export function firstLevelId(): string {
  const first = LEVELS[0];
  if (!first) throw new Error('No levels registered');
  return first.id;
}

export function hasLevel(id: string): boolean {
  return levelsById.has(id);
}

/** What validateLevel needs to know about the registered content; shared by tests and runtime. */
export function levelValidationContext(): LevelValidationContext {
  return {
    tileChars: TILE_CHARS,
    characterKinds: new Map(CHARACTERS.map((c) => [c.id, c.kind])),
    levelIds: new Set(levelsById.keys()),
  };
}
