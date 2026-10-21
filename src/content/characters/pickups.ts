import { COLORS } from '../../graphics/palette';
import type { CollectibleDefinition, SpriteFrame } from '../types';

const PICKUP_BODY = { width: 10, height: 10, offsetX: 3, offsetY: 3 } as const;

const star = (centre: string): SpriteFrame => [
  '................',
  '................',
  '................',
  '.......yy.......',
  '.......yy.......',
  '......yYYy......',
  '.yyyyyYYYYyyyyy.',
  `..yYYYY${centre}YYYYy..`,
  '....yYYYYYYy....',
  '.....yYYYYy.....',
  '....yYYyyYYy....',
  '....yYy..yYy....',
  '...yy......yy...',
  '................',
  '................',
  '................',
];

export const starPickup: CollectibleDefinition = {
  id: 'star',
  kind: 'collectible',
  sprite: {
    palette: { '.': null, y: COLORS.gold, Y: COLORS.yellow, w: COLORS.white },
    frames: [star('YY'), star('ww')],
    animations: {
      idle: { frames: [0, 1], frameRate: 3, repeat: -1 },
    },
  },
  body: PICKUP_BODY,
  scoreValue: 50,
};

const cell = (charge: string): SpriteFrame => [
  '................',
  '................',
  '......kkkk......',
  '.....kSSSSk.....',
  '....kkkkkkkk....',
  '....kcllccck....',
  `....k${charge}k....`,
  `....k${charge}k....`,
  '....kcccccck....',
  `....k${charge}k....`,
  `....k${charge}k....`,
  '....kcccccck....',
  '....kkkkkkkk....',
  '................',
  '................',
  '................',
];

export const energyCell: CollectibleDefinition = {
  id: 'energy-cell',
  kind: 'collectible',
  sprite: {
    palette: {
      '.': null,
      k: COLORS.void,
      S: COLORS.steelLight,
      c: COLORS.cyan,
      l: COLORS.cyanLight,
      b: COLORS.blue,
    },
    frames: [cell('cccccc'), cell('cbbbbc')],
    animations: {
      idle: { frames: [0, 1], frameRate: 2, repeat: -1 },
    },
  },
  body: PICKUP_BODY,
  scoreValue: 150,
};
