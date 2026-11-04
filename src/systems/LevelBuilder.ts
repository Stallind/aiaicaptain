import Phaser from 'phaser';
import { DEPTH, TILE_SIZE } from '../config/constants';
import { ENTITY_LAYER, GROUND_LAYER, TEXTURE_KEYS, TILESET_NAME } from '../config/scenes';
import { getCharacter, levelValidationContext } from '../content/registry';
import { TILES, TILE_CHARS } from '../content/tiles';
import type { LevelDefinition, PlayerDefinition, TileDefinition } from '../content/types';
import { Collectible } from '../entities/Collectible';
import { Enemy } from '../entities/Enemy';
import { Goal } from '../entities/Goal';
import { Player } from '../entities/Player';
import { asciiToTiledMap } from '../utils/asciiMap';
import { validateLevel } from '../utils/validateLevel';

export interface LevelWorld {
  readonly map: Phaser.Tilemaps.Tilemap;
  readonly ground: Phaser.Tilemaps.TilemapLayer;
  readonly player: Player;
  readonly enemies: Enemy[];
  readonly collectibles: Collectible[];
  readonly goals: Goal[];
  /** Tile ids (see tileIdsWhere) that hurt on contact. */
  readonly hazardIndexes: ReadonlySet<number>;
}

/**
 * Tile ids of the tiles matching the predicate. A tile id is what Tiled calls a
 * "global tile id" (gid): the tile's index in TILES plus 1, because 0 means empty.
 */
function tileIdsWhere(predicate: (tile: TileDefinition) => boolean): number[] {
  return TILES.flatMap((tile, i) => (predicate(tile) ? [i + 1] : []));
}

/** Builds the level; `player` is spawned at the level's player spawn point, whatever character the layout names. */
export function buildLevel(
  scene: Phaser.Scene,
  level: LevelDefinition,
  player: PlayerDefinition,
): LevelWorld {
  assertLevelIsValid(level);
  const map = createTilemap(scene, level);
  const ground = createGroundLayer(scene, map, level.id);
  const spawned = spawnEntities(scene, map, ground, player, level.id);
  return { map, ground, ...spawned, hazardIndexes: new Set(tileIdsWhere((t) => t.hazard)) };
}

/** Tests validate bundled levels too; this guards content that bypasses them (e.g. a future level loader). */
function assertLevelIsValid(level: LevelDefinition): void {
  const errors = validateLevel(level, levelValidationContext());
  if (errors.length > 0) {
    throw new Error(`Level "${level.id}" is invalid: ${errors.join('; ')}`);
  }
}

function createTilemap(scene: Phaser.Scene, level: LevelDefinition): Phaser.Tilemaps.Tilemap {
  const key = `level:${level.id}`;
  if (!scene.cache.tilemap.exists(key)) {
    const data = asciiToTiledMap({
      layout: level.layout,
      tileChars: TILE_CHARS,
      entities: level.entities,
      tileSize: TILE_SIZE,
      tilesetName: TILESET_NAME,
      groundLayer: GROUND_LAYER,
      entityLayer: ENTITY_LAYER,
    });
    // Same shape the Phaser loader stores for a Tiled JSON file.
    scene.cache.tilemap.add(key, { format: Phaser.Tilemaps.Formats.TILED_JSON, data });
  }
  const map = scene.make.tilemap({ key });
  // Phaser falls back to an empty map instead of failing when parsing goes wrong.
  if (map.width === 0 || map.getLayerIndex(GROUND_LAYER) === null) {
    throw new Error(
      `Tilemap for level "${level.id}" could not be parsed – Phaser logged the reason in the console`,
    );
  }
  return map;
}

function createGroundLayer(
  scene: Phaser.Scene,
  map: Phaser.Tilemaps.Tilemap,
  levelId: string,
): Phaser.Tilemaps.TilemapLayer {
  if (!scene.textures.exists(TEXTURE_KEYS.tiles)) {
    throw new Error(
      `Tileset texture "${TEXTURE_KEYS.tiles}" is missing – BootScene must run before GameScene`,
    );
  }
  const tileset = map.addTilesetImage(TILESET_NAME, TEXTURE_KEYS.tiles);
  if (!tileset)
    throw new Error(`Level "${levelId}": tileset "${TILESET_NAME}" not found in the map`);
  const layer = map.createLayer(GROUND_LAYER, tileset);
  if (!layer)
    throw new Error(`Level "${levelId}": tile layer "${GROUND_LAYER}" not found in the map`);
  layer.setDepth(DEPTH.tiles);
  layer.setCollision(tileIdsWhere((t) => t.solid));
  const oneWay = new Set(tileIdsWhere((t) => t.oneWay));
  layer.forEachTile((tile) => {
    if (oneWay.has(tile.index)) collideFromAboveOnly(tile);
  });
  return layer;
}

/** One-way platform: the player can jump up through it and land on top. */
function collideFromAboveOnly(tile: Phaser.Tilemaps.Tile): void {
  const left = false;
  const right = false;
  const up = true;
  const down = false;
  tile.setCollision(left, right, up, down);
}

function spawnEntities(
  scene: Phaser.Scene,
  map: Phaser.Tilemaps.Tilemap,
  ground: Phaser.Tilemaps.TilemapLayer,
  chosenPlayer: PlayerDefinition,
  levelId: string,
): Pick<LevelWorld, 'player' | 'enemies' | 'collectibles' | 'goals'> {
  let player: Player | undefined;
  const enemies: Enemy[] = [];
  const collectibles: Collectible[] = [];
  const goals: Goal[] = [];

  const objectLayer = map.getObjectLayer(ENTITY_LAYER);
  if (!objectLayer) {
    throw new Error(`Level "${levelId}": object layer "${ENTITY_LAYER}" not found in the map`);
  }
  for (const object of objectLayer.objects) {
    const definition = getCharacter(object.name);
    // Maps from the Tiled editor may omit coordinates; placing at 0,0 would hide the mistake.
    if (object.x === undefined || object.y === undefined) {
      throw new Error(
        `Level "${levelId}": object "${object.name}" (id ${object.id}) has no position`,
      );
    }
    const { x, y } = object;
    switch (definition.kind) {
      case 'player':
        player = new Player(scene, x, y, chosenPlayer);
        break;
      case 'enemy':
        enemies.push(new Enemy(scene, x, y, definition, ground));
        break;
      case 'collectible':
        collectibles.push(new Collectible(scene, x, y, definition));
        break;
      case 'goal':
        goals.push(new Goal(scene, x, y, definition));
        break;
    }
  }
  if (!player) {
    throw new Error(
      `Level "${levelId}" has no player spawn – add a 'P' (or another player character) to its layout`,
    );
  }
  return { player, enemies, collectibles, goals };
}
