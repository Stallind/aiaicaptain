import { renderGlyphGrid } from '../../graphics/binaryGlyphs';
import { COLORS } from '../../graphics/palette';
import type { PlayerDefinition, SpriteFrame } from '../types';

// The AI Captain is made of nothing but 0s and 1s. Each grid cell below becomes
// a 3×5 pixel digit; the digits change between frames so he flickers like a
// data stream. Grid: head (2 digits), torso with arms (4), legs.
const LEGS_TOGETHER = '.GG.';
const LEGS_APART = 'G..G';

const body = (head: string, torso: string, legs: string, legColours: string): SpriteFrame =>
  renderGlyphGrid({
    digits: [head, torso, legs],
    colours: ['.cc.', 'GggG', legColours],
  });

// A head-and-shoulders bust, still only digits: cap, face with ears, the two
// 0s are his eyes, a 0000 smile, a neck and uniform shoulders with epaulettes.
const portraitGrid = renderGlyphGrid({
  digits: [
    '....1111....', // cap crown
    '...110011...', // cap band with badge
    '..11111111..', // brim
    '..10111101..', // hair at the temples
    '.1101111011.', // ears and eyes
    '..11111111..', // cheeks and nose
    '...100001...', // smile
    '....1111....', // neck
    '111111111111', // shoulders
  ],
  colours: [
    '....yyyy....',
    '...wwyywww..',
    '..GGGGGGGG..',
    '..GggggggG..',
    '.GgCggggCgG.',
    '..gggccggg..',
    '...gwwwwg...',
    '....GGGG....',
    'yBBBBccBBBBy',
  ],
});

const palette = {
  '.': null,
  c: COLORS.cyan,
  C: COLORS.cyanLight,
  g: COLORS.green,
  G: COLORS.greenDark,
  w: COLORS.white,
  y: COLORS.gold,
  B: COLORS.blue,
} as const;

export const aiCaptain: PlayerDefinition = {
  id: 'ai-captain',
  kind: 'player',
  displayName: 'AI Captain',
  tagline: 'Fast, compiled and 100% binary',
  sprite: {
    palette,
    frames: [
      body('.10.', '1011', '.10.', LEGS_TOGETHER),
      body('.01.', '1101', '.01.', LEGS_TOGETHER),
      body('.10.', '0110', '1..0', LEGS_APART),
      body('.01.', '1001', '.11.', LEGS_TOGETHER),
      body('.11.', '1001', '1..1', LEGS_APART),
    ],
    animations: {
      idle: { frames: [0, 1], frameRate: 3, repeat: -1 },
      run: { frames: [2, 3], frameRate: 10, repeat: -1 },
      jump: { frames: [4], frameRate: 1, repeat: -1 },
    },
  },
  portrait: { palette, frame: portraitGrid },
  jumpSound: 'jump-bits',
  // The digit grid leaves an empty row at the bottom; the hitbox ends on the last inked row.
  body: { width: 10, height: 15, offsetX: 3, offsetY: 2 },
  stats: { speed: 165, jumpVelocity: 370, health: 3 },
};
