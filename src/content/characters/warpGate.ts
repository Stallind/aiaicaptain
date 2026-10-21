import { COLORS } from '../../graphics/palette';
import type { GoalDefinition, SpriteFrame } from '../types';

const MIDDLE_ROWS = 24;

// Alternating rows make the energy field shimmer when the two frames swap.
const gate = (even: string, odd: string): SpriteFrame => [
  '....kkkkkkkk....',
  '...kssssssssk...',
  '..kssccccccssk..',
  '..ksccllllccsk..',
  ...Array.from({ length: MIDDLE_ROWS }, (_, i) => (i % 2 === 0 ? even : odd)),
  '..ksccllllccsk..',
  '..kssccccccssk..',
  '...kssssssssk...',
  '....kkkkkkkk....',
];

const ROW_A = '..kscclllcccsk..';
const ROW_B = '..ksccclllccsk..';

export const warpGate: GoalDefinition = {
  id: 'warp-gate',
  kind: 'goal',
  sprite: {
    palette: {
      '.': null,
      k: COLORS.void,
      s: COLORS.steel,
      c: COLORS.cyan,
      l: COLORS.cyanLight,
    },
    frames: [gate(ROW_A, ROW_B), gate(ROW_B, ROW_A)],
    animations: {
      idle: { frames: [0, 1], frameRate: 6, repeat: -1 },
    },
  },
  body: { width: 8, height: 28, offsetX: 4, offsetY: 4 },
};
