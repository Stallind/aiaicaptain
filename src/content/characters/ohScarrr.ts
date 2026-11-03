import { COLORS } from '../../graphics/palette';
import type { PlayerDefinition, SpriteFrame } from '../types';

// Big head with headphones and mic, drawn from the same likeness as the portrait.
const head = [
  '....kkkkkkkk....',
  '...khhhhhhhhk...',
  '..khhhhhhhhhhk..',
  '.kkhSSSSSSSShkk.',
  'kkkSLSSSSSSSSkkk',
  'kWkSnnSSSSnnSkWk',
  'kkkSkLSSSSkLSkkk',
  'kkkSSSSsSSSSSkkk',
  '.kksSSSnnSSSskn.',
  '...ksSSSSSSskn..',
  '....kssssssk....',
  '..ktttuuuutttk..',
  '.kStttttttttTSk.',
] as const;

const standingLegs = ['...kppppppppk...', '...kpppkkpppk...', '...kkkk..kkkk...'] as const;
const strideLegs = ['...kppppppppk...', '..kpppk..kpppk..', '..kkkk....kkkk..'] as const;
const passingLegs = ['...kppppppppk...', '....kpppppk.....', '....kkkkkkk.....'] as const;
const tuckedLegs = ['..kppppppppppk..', '..kppk....kppk..', '..kkk......kkk..'] as const;

const frame = (legs: readonly string[]): SpriteFrame => [...head, ...legs];

const palette = {
  '.': null,
  k: COLORS.void,
  h: COLORS.hair,
  n: COLORS.hairLight,
  D: COLORS.skinDark,
  s: COLORS.skinShadow,
  S: COLORS.skin,
  L: COLORS.skinLight,
  W: COLORS.skinHighlight,
  T: COLORS.shirtDark,
  t: COLORS.shirt,
  o: COLORS.shirtLight,
  u: COLORS.white,
  p: COLORS.slate,
} as const;

export const ohScarrr: PlayerDefinition = {
  id: 'oh-scarrr',
  kind: 'player',
  displayName: 'Oh Scarrr',
  tagline: 'Steady, tough and always on comms',
  sprite: {
    palette,
    frames: [frame(standingLegs), frame(strideLegs), frame(passingLegs), frame(tuckedLegs)],
    animations: {
      idle: { frames: [0], frameRate: 1, repeat: -1 },
      run: { frames: [1, 2], frameRate: 10, repeat: -1 },
      jump: { frames: [3], frameRate: 1, repeat: -1 },
    },
  },
  // Pixelated from a photo, then cleaned up by hand.
  portrait: {
    palette,
    frame: [
      '................kkkk............',
      '...........kkkkksDnDkkkk........',
      '.........kksDnnnnnhhhhnDkkk.....',
      '........kDhhnnnnnhhhhhhkkhDk....',
      '......kkhhnDDnnhhhhhhhnhhhkhkk..',
      '.....kshnhDSsDnhhhhhhhnDDhhhksk.',
      '.....kkhhnSSSssDDnnnnssSSDhhhknk',
      '....kkkhhSLSSSLSSSSssSSSSshkhkkk',
      '...khnLhDLLSSSLLSSSSSSSSssnkkkkn',
      '...kksWhLLLSSSSSSSSSSSssssDkkkkk',
      '..kDkknDWLLLLLSSSSSSSsssssDhkhnk',
      '.knhhhksWLLLLLLLSSSSSSSsssDhknWk',
      '.khnhhhSLsnDsSSSSSSSSSSssDDhkhnk',
      '.khhhhnSsssDnnnDsssDDnnnnDDhkkkk',
      'kshhkhnLSsDnnnnnsDnnnnnnnnDnkkkk',
      'kskkhknLLLsDnnnsLsnnnhhnnDDhkkkk',
      '.kkkkknLLLLSssSSLSDDDDnnDDDhkkkk',
      '.kkkkknLLLLLLLSSLSDsSsssssDkkkkk',
      '.kDkkkDLLLLLLSSLLSssSSSSssDkkkkk',
      '..kksnskLLLSSSDnDDnDSSSsssnkkkkn',
      '....kkkkkSSSSSsDnnhDsSSssshkkkhk',
      '.......kSssssSSSssDDssssDDDhhnk.',
      '.......ksssDDnhnnhnDDDDDnDWsDk..',
      '.......ksssssDDnnnnnDDDnnSWnk...',
      '.......kssssSsDnDDDDDDnnnLDsk...',
      '......ksDDssSSSssssDDnhkkDkk....',
      '...kkkktttttoooooootttTTTtkk....',
      '.kkttttttttttttttttttttTTTTtk...',
      'ktttttttttttttttttttttTTTTTTtkkk',
      'kttootttttttttttttttttTTTTttTTtt',
      'tttttTTTttttttttttttttTTTTTtTTtt',
      'ttttTTTTTTttuuuuuuuutTTTTTTTTTTt',
    ],
  },
  body: { width: 10, height: 15, offsetX: 3, offsetY: 1 },
  stats: { speed: 140, jumpVelocity: 390, health: 4 },
};
