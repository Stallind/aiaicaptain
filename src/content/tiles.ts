import { COLORS } from '../graphics/palette';
import type { Palette, TileDefinition } from './types';

export const TILE_PALETTE: Palette = {
  '.': null,
  k: COLORS.void,
  r: COLORS.rock,
  L: COLORS.rockLight,
  D: COLORS.rockDark,
  s: COLORS.steel,
  S: COLORS.steelLight,
  n: COLORS.slate,
  y: COLORS.gold,
  w: COLORS.white,
  e: COLORS.red,
};

const asteroidTop: TileDefinition = {
  char: '#',
  solid: true,
  oneWay: false,
  hazard: false,
  frame: [
    'LLLLLLLLLLLLLLLL',
    'LLwLLLLLLLLwLLLL',
    'LLLLLrLLLLLLLrLL',
    'rLLrrrrLLrLrrrrL',
    'rrrrrrrrrrrrrrrr',
    'rrrrDrrrrrrrrrrr',
    'rrrDDDrrrrrrDrrr',
    'rrrrDrrrrrrDDDrr',
    'rrrrrrrrrrrrDrrr',
    'rrrrrrrDrrrrrrrr',
    'rDrrrrDDDrrrrrrr',
    'rrrrrrrDrrrrrrDr',
    'rrrrrrrrrrrrrDDD',
    'rrrDrrrrrrrrrrDr',
    'rrDDDrrrrrDrrrrr',
    'rrrDrrrrrrrrrrrr',
  ],
};

const asteroidFill: TileDefinition = {
  char: '%',
  solid: true,
  oneWay: false,
  hazard: false,
  frame: [
    'rrrrrrrrrrrrrrrr',
    'rrrrDrrrrrrrrrrr',
    'rrrDDDrrrrrrDrrr',
    'rrrrDrrrrrrDDDrr',
    'rrrrrrrrrrrrDrrr',
    'rrrrrrrDrrrrrrrr',
    'rDrrrrDDDrrrrrrr',
    'rrrrrrrDrrrrrrDr',
    'rrrrrrrrrrrrrDDD',
    'rrrDrrrrrrrrrrDr',
    'rrDDDrrrrrDrrrrr',
    'rrrDrrrrrrrrrrrr',
    'rrrrrrrrrrrDrrrr',
    'rrrrrrrrrrDDDrrr',
    'rrrrDrrrrrrDrrrr',
    'rrrrrrrrrrrrrrrr',
  ],
};

const metalBlock: TileDefinition = {
  char: '=',
  solid: true,
  oneWay: false,
  hazard: false,
  frame: [
    'kkkkkkkkkkkkkkkk',
    'kSSSSSSSSSSSSSSk',
    'kSnSSSSSSSSSSnSk',
    'kSSssssssssssSSk',
    'kSsssssssssssssk',
    'kSsssssssssssssk',
    'kSssssyyyyssssnk',
    'kSssssyyyysssssk',
    'kSssssyyyyssssnk',
    'kSssssyyyysssssk',
    'kSsssssssssssssk',
    'kSsssssssssssssk',
    'kSssssssssssssnk',
    'kSnsssssssssnsnk',
    'knnnnnnnnnnnnnnk',
    'kkkkkkkkkkkkkkkk',
  ],
};

const girder: TileDefinition = {
  char: '-',
  solid: true,
  oneWay: true,
  hazard: false,
  frame: [
    'kkkkkkkkkkkkkkkk',
    'SSSSSSSSSSSSSSSS',
    'ssssssssssssssss',
    'nsnnnsnnnnsnnnsn',
    'kkkkkkkkkkkkkkkk',
    '.k...k....k...k.',
    '..k.k......k.k..',
    '...k........k...',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
};

const spikes: TileDefinition = {
  char: '^',
  solid: false,
  oneWay: false,
  hazard: true,
  frame: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '...w.......w....',
    '...S.......S....',
    '..wSs.....wSs...',
    '..SSs.....SSs...',
    '.wSSss...wSSss..',
    '.SSSss...SSSss..',
    'wSSSsss.wSSSsss.',
    'SSSSsssnSSSSsssn',
    'eeeeeeeeeeeeeeee',
    'kkkkkkkkkkkkkkkk',
  ],
};

/** Order matters: index + 1 is the Tiled gid, and index is the frame in the tileset texture. */
export const TILES: readonly TileDefinition[] = [
  asteroidTop,
  asteroidFill,
  metalBlock,
  girder,
  spikes,
];

export const TILE_CHARS: readonly string[] = TILES.map((tile) => tile.char);
