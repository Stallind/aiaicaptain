import type { TiledMap, TiledObject } from './tiled';

export const EMPTY_CHAR = '.';

export interface AsciiMapOptions {
  readonly layout: readonly string[];
  /** Tile characters in tileset order; index 0 gets gid 1. */
  readonly tileChars: readonly string[];
  /** Layout character -> object name (character id). */
  readonly entities: Readonly<Record<string, string>>;
  readonly tileSize: number;
  readonly tilesetName: string;
  readonly groundLayer: string;
  readonly entityLayer: string;
}

/**
 * Converts a hand-written ASCII layout into a Tiled-compatible map. Entities
 * become point objects at the bottom-centre of their cell, so sprites with
 * origin (0.5, 1) stand on the floor below them.
 */
export function asciiToTiledMap(options: AsciiMapOptions): TiledMap {
  const { layout, tileChars, entities, tileSize } = options;
  const height = layout.length;
  const width = layout[0]?.length ?? 0;
  const data: number[] = [];
  const objects: TiledObject[] = [];

  layout.forEach((row, y) => {
    for (let x = 0; x < width; x++) {
      const char = row.charAt(x);
      const tileIndex = tileChars.indexOf(char);
      data.push(tileIndex >= 0 ? tileIndex + 1 : 0);
      const name = entities[char];
      if (name !== undefined) {
        objects.push({
          id: objects.length + 1,
          name,
          type: '',
          x: x * tileSize + tileSize / 2,
          y: (y + 1) * tileSize,
          width: 0,
          height: 0,
          rotation: 0,
          visible: true,
          point: true,
        });
      }
    }
  });

  return {
    type: 'map',
    version: '1.10',
    orientation: 'orthogonal',
    renderorder: 'right-down',
    infinite: false,
    width,
    height,
    tilewidth: tileSize,
    tileheight: tileSize,
    nextlayerid: 3,
    nextobjectid: objects.length + 1,
    layers: [
      {
        type: 'tilelayer',
        id: 1,
        name: options.groundLayer,
        width,
        height,
        x: 0,
        y: 0,
        opacity: 1,
        visible: true,
        data,
      },
      {
        type: 'objectgroup',
        id: 2,
        name: options.entityLayer,
        x: 0,
        y: 0,
        opacity: 1,
        visible: true,
        draworder: 'topdown',
        objects,
      },
    ],
    tilesets: [
      {
        firstgid: 1,
        name: options.tilesetName,
        tilewidth: tileSize,
        tileheight: tileSize,
        tilecount: tileChars.length,
        columns: tileChars.length,
        image: options.tilesetName,
        imagewidth: tileChars.length * tileSize,
        imageheight: tileSize,
        margin: 0,
        spacing: 0,
      },
    ],
  };
}
