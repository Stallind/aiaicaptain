import { COLORS } from '../../graphics/palette';
import type { EnemyDefinition, SpriteFrame } from '../types';

const standing: SpriteFrame = [
  '................',
  '....k......k....',
  '.....k....k.....',
  '......kkkk......',
  '.....kppppk.....',
  '....kppppppk....',
  '...kppwwwwppk...',
  '...kppwkkwppk...',
  '...kppwwwwppk...',
  '...kppppppppk...',
  '....kppppppk....',
  '....kddddddk....',
  '...kdk....kdk...',
  '..kdk......kdk..',
  '..kk........kk..',
  '................',
];

const crouching: SpriteFrame = [
  '................',
  '................',
  '................',
  '....k......k....',
  '.....k....k.....',
  '......kkkk......',
  '.....kppppk.....',
  '...kppppppppk...',
  '..kpppwwwwpppk..',
  '..kpppwkkwpppk..',
  '..kpppwwwwpppk..',
  '..kppppppppppk..',
  '...kddddddddk...',
  '..kdkk....kkdk..',
  '..kk........kk..',
  '................',
];

export const hopper: EnemyDefinition = {
  id: 'hopper',
  kind: 'enemy',
  sprite: {
    palette: {
      '.': null,
      k: COLORS.void,
      p: COLORS.purple,
      d: COLORS.purpleDark,
      w: COLORS.yellow,
    },
    frames: [standing, crouching],
    animations: {
      walk: { frames: [0, 1], frameRate: 3, repeat: -1 },
    },
  },
  body: { width: 10, height: 11, offsetX: 3, offsetY: 4 },
  stats: { speed: 30, jumpVelocity: 300, health: 1 },
  scoreValue: 200,
  stompable: true,
  components: [
    { type: 'patrol', turnAtLedges: false },
    { type: 'jumper', intervalMs: 1600 },
  ],
};
