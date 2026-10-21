import { COLORS } from '../graphics/palette';
import type { Palette, SpriteFrame } from './types';

export const UI_PALETTE: Palette = {
  '.': null,
  k: COLORS.void,
  r: COLORS.red,
  w: COLORS.white,
  n: COLORS.slate,
};

export const HEART_FRAME: SpriteFrame = [
  '.kk...kk.',
  'krrk.krrk',
  'krwrkrrrk',
  'krrrrrrrk',
  '.krrrrrk.',
  '..krrrk..',
  '...krk...',
  '....k....',
];

export const HEART_EMPTY_FRAME: SpriteFrame = HEART_FRAME.map((row) => row.replace(/[rw]/g, 'n'));
