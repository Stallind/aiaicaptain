import { describe, expect, it } from 'vitest';
import { asciiToTiledMap } from '../../src/utils/asciiMap';
import type { TiledObjectLayer, TiledTileLayer } from '../../src/utils/tiled';

const map = asciiToTiledMap({
  layout: ['P..*', '##=.'],
  tileChars: ['#', '='],
  entities: { P: 'captain', '*': 'star' },
  tileSize: 16,
  tilesetName: 'tiles',
  groundLayer: 'ground',
  entityLayer: 'entities',
});

describe('asciiToTiledMap', () => {
  it('sets map dimensions', () => {
    expect(map.width).toBe(4);
    expect(map.height).toBe(2);
    expect(map.tilewidth).toBe(16);
  });

  it('maps tile characters to gids starting at 1', () => {
    const layer = map.layers[0] as TiledTileLayer;
    expect(layer.type).toBe('tilelayer');
    expect(layer.data).toEqual([0, 0, 0, 0, 1, 1, 2, 0]);
  });

  it('places entities as points at the bottom-centre of their cell', () => {
    const layer = map.layers[1] as TiledObjectLayer;
    expect(layer.objects.map((o) => [o.name, o.x, o.y])).toEqual([
      ['captain', 8, 16],
      ['star', 56, 16],
    ]);
  });

  it('describes a single-row tileset matching the tile list', () => {
    expect(map.tilesets[0]).toMatchObject({
      firstgid: 1,
      tilecount: 2,
      columns: 2,
      imagewidth: 32,
    });
  });
});
