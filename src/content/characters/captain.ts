import { COLORS } from '../../graphics/palette';
import type { PlayerDefinition, SpriteFrame } from '../types';

// Helmet and torso are shared by every frame; only the legs change.
const upperBody = [
  '................',
  '.....kkkkkk.....',
  '....kwwwwwwk....',
  '...kwwccccwwk...',
  '...kwcclccwwk...',
  '...kwccccccwk...',
  '...kwwccccwwk...',
  '....kwwwwwwk....',
  '....kdoooodk....',
  '...kooowwoook...',
  '..kwkooooookwk..',
  '...kdoooooodk...',
] as const;

const standingLegs = [
  '....kddkkddk....',
  '....kddkkddk....',
  '...kbbbkkbbbk...',
  '...kkkkkkkkkk...',
] as const;

const strideLegs = [
  '...kddk..kddk...',
  '..kddk....kddk..',
  '..kbbk....kbbk..',
  '..kkk......kkk..',
] as const;

const passingLegs = [
  '....kddkkdk.....',
  '.....kddddk.....',
  '.....kbbbbk.....',
  '.....kkkkkk.....',
] as const;

const tuckedLegs = [
  '...kddk..kddk...',
  '...kbbk..kbbk...',
  '...kkkk..kkkk...',
  '................',
] as const;

const frame = (legs: readonly string[]): SpriteFrame => [...upperBody, ...legs];

export const captain: PlayerDefinition = {
  id: 'captain',
  kind: 'player',
  sprite: {
    palette: {
      '.': null,
      k: COLORS.void,
      w: COLORS.white,
      c: COLORS.cyan,
      l: COLORS.cyanLight,
      o: COLORS.orange,
      d: COLORS.orangeDark,
      b: COLORS.slate,
    },
    frames: [frame(standingLegs), frame(strideLegs), frame(passingLegs), frame(tuckedLegs)],
    animations: {
      idle: { frames: [0], frameRate: 1, repeat: -1 },
      run: { frames: [1, 2], frameRate: 10, repeat: -1 },
      jump: { frames: [3], frameRate: 1, repeat: -1 },
    },
  },
  body: { width: 10, height: 15, offsetX: 3, offsetY: 1 },
  stats: { speed: 150, jumpVelocity: 370, health: 3 },
};
