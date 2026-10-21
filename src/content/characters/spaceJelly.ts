import { COLORS } from '../../graphics/palette';
import type { EnemyDefinition, SpriteFrame } from '../types';

const bell = [
  '................',
  '.....kkkkkk.....',
  '...kkmmmmmmkk...',
  '..kmmmmmmmmmmk..',
  '.kmmwwmmmmwwmmk.',
  '.kmmwkmmmmwkmmk.',
  '.kmlmmmmmmmmlmk.',
  '.kkkkkkkkkkkkkk.',
] as const;

const tentaclesA = [
  '..m..m....m..m..',
  '..m..m....m..m..',
  '...m..m..m..m...',
  '...m..m..m..m...',
  '..m..m....m..m..',
  '................',
  '................',
  '................',
] as const;

const tentaclesB = [
  '...m..m..m..m...',
  '..m..m....m..m..',
  '..m..m....m..m..',
  '...m..m..m..m...',
  '...m..m..m..m...',
  '................',
  '................',
  '................',
] as const;

const frame = (tentacles: readonly string[]): SpriteFrame => [...bell, ...tentacles];

export const spaceJelly: EnemyDefinition = {
  id: 'space-jelly',
  kind: 'enemy',
  sprite: {
    palette: {
      '.': null,
      k: COLORS.void,
      m: COLORS.pink,
      l: COLORS.pinkLight,
      w: COLORS.white,
    },
    frames: [frame(tentaclesA), frame(tentaclesB)],
    animations: {
      walk: { frames: [0, 1], frameRate: 5, repeat: -1 },
    },
  },
  body: { width: 12, height: 10, offsetX: 2, offsetY: 2 },
  stats: { speed: 25, jumpVelocity: 0, health: 1 },
  scoreValue: 300,
  stompable: true,
  components: [
    { type: 'flyer', amplitude: 24, periodMs: 2400 },
    { type: 'patrol', turnAtLedges: false },
  ],
};
