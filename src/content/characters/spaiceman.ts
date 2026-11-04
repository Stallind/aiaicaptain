import { COLORS } from '../../graphics/palette';
import type { PlayerDefinition, SpriteFrame } from '../types';

// A retro astronaut with no face: his glass helmet holds a small spiral galaxy,
// with two stars for eyes. An orange scarf trails behind him, and his rocket
// boots flare when he jumps.
const head = [
  '............y...',
  '.....kkkkkk.k...',
  '...kkwwwwwwkkk..',
  '..kwwvvvvvvwwk..',
  '..kwvVyVVVyVwk..',
  '..kwvVVpVVVcwk..',
  '..kwvvVVppVvwk..',
  '...kwwvvvvvwk...',
  '....kkwwwwkk....',
  '...koooooooOk...',
  '.OOkwwwyywwgk...',
  'Oo.kgwwwwwwgk...',
  '...kGgwwwwgGk...',
] as const;

const standingLegs = ['...kwwk..kwwk...', '...kwwk..kwwk...', '...kGGk..kGGk...'] as const;
const strideLegs = ['..kwwk....kwwk..', '.kwwk......kwwk.', '.kGGk......kGGk.'] as const;
const passingLegs = ['.....kwwwwk.....', '.....kwwwwk.....', '.....kGGGGk.....'] as const;
// Knees up, with flames from the rocket boots.
const jetLegs = ['...kwwk..kwwk...', '...kGGk..kGGk...', '....yo....oy....'] as const;

const frame = (legs: readonly string[]): SpriteFrame => [...head, ...legs];

const palette = {
  '.': null,
  k: COLORS.void,
  w: COLORS.white,
  u: COLORS.white,
  g: COLORS.steelLight,
  G: COLORS.steel,
  v: COLORS.purpleDark,
  V: COLORS.purple,
  p: COLORS.pink,
  y: COLORS.yellow,
  c: COLORS.cyanLight,
  o: COLORS.orange,
  O: COLORS.orangeDark,
} as const;

export const spaiceman: PlayerDefinition = {
  id: 'spaiceman',
  kind: 'player',
  displayName: 'Spaiceman',
  tagline: 'A galaxy in a helmet: fast, floaty, fragile',
  sprite: {
    palette,
    frames: [frame(standingLegs), frame(strideLegs), frame(passingLegs), frame(jetLegs)],
    animations: {
      idle: { frames: [0], frameRate: 1, repeat: -1 },
      run: { frames: [1, 2], frameRate: 12, repeat: -1 },
      jump: { frames: [3], frameRate: 1, repeat: -1 },
    },
  },
  // A spiral nebula inside a round helmet, with the scarf blowing to the left.
  portrait: {
    palette,
    frame: [
      '...........................yy...',
      '...........................ky...',
      '.............kkkkkk.......k.....',
      '..........kkkwwwwwwkkk...k......',
      '........kkwwwwwwwwggggkk........',
      '.......kkcwwvvvvvvvvgggkk.......',
      '......kkcwwvvVVVvvvvvgggkk......',
      '......kcwvvVVVVVuVvvvvvggk......',
      '.....kwwvuVvvvvvvVVvvvvvggk.....',
      '....kkwwvvvvvvvvvvVVvvuvggkk....',
      '....kwwvvvvvvvvvvvvVvvvvvggk....',
      '....kwwvvvvvvvvvvvvpVvvvvggk....',
      '....kwwvvvvyvppvvvvpyvvvvggk....',
      '....kwvvvvyyypvvvvvyyyvvvvgk....',
      '....kwvvvvvypvvvvvppyvvvvvgk....',
      '....kwwvvvvVpvvvvppvvvvvuggk....',
      '....kwguvvvVpvvvvvvvvvvvvggk....',
      '....kggvvvvvVvvvvvvvvvvvvggk....',
      '....kkggvvvvVVuvvvvuvvvvggkk....',
      '.....kggvvvvvVVvvvvvvVvvggk.....',
      '......kggvvvvvVVVVVVVvvggk......',
      '......kkgggvvvvvVVVvvgggkk......',
      '.......kkgggvvvvvvvvgggkk.......',
      '.......kooooooooooooooook.......',
      '.....kgooooooooooooooOOOwwk.....',
      '....koogggggwkkkkkkwwwwwwwwk....',
      '..koooggggggwwwwwwwwwwwwwwwwwk..',
      '.kooOgggggggwwwwwwwwwwwwwwwwwwk.',
      'gOOgggggggggwwwwwwwwyywwwwwwwwww',
      'ggggggggggggwwwwwwwwyywwwwwwwwww',
      'ggggggggggggwwwwwwwwwwwwwwwwwwww',
      'ggggggggggggwwwwwwwwwwwwwwwwwwww',
    ],
  },
  jumpSound: 'jump-jet',
  // The antenna sits above the hitbox, like a hat would.
  body: { width: 10, height: 15, offsetX: 3, offsetY: 1 },
  // The quickest, highest jumper, but two hits and he's out.
  stats: { speed: 180, jumpVelocity: 400, health: 2 },
};
