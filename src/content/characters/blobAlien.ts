import { COLORS } from '../../graphics/palette';
import type { EnemyDefinition, SpriteFrame } from '../types';

const tall: SpriteFrame = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '.....kkkkkk.....',
  '....kggggggk....',
  '...kggggggggk...',
  '..kggwwggwwggk..',
  '..kggwkggwkggk..',
  '.kggggggggggggk.',
  '.kgGggggggggGgk.',
  '.kggggggggggggk.',
  '.kddddddddddddk.',
  '..kkkkkkkkkkkk..',
  '................',
];

const squashed: SpriteFrame = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '......kkkk......',
  '...kkggggggkk...',
  '..kggwwggwwggk..',
  '.kgggwkggwkgggk.',
  'kggggggggggggggk',
  'kggGgggggggggGgk',
  'kggggggggggggggk',
  'kddddddddddddddk',
  '.kkkkkkkkkkkkkk.',
  '................',
];

export const blobAlien: EnemyDefinition = {
  id: 'blob-alien',
  kind: 'enemy',
  sprite: {
    palette: {
      '.': null,
      k: COLORS.void,
      g: COLORS.green,
      G: COLORS.white,
      d: COLORS.greenDark,
      w: COLORS.white,
    },
    frames: [tall, squashed],
    animations: {
      walk: { frames: [0, 1], frameRate: 4, repeat: -1 },
    },
  },
  body: { width: 12, height: 9, offsetX: 2, offsetY: 6 },
  stats: { speed: 40, jumpVelocity: 0, health: 1 },
  scoreValue: 100,
  stompable: true,
  components: [{ type: 'patrol', turnAtLedges: true }],
};
