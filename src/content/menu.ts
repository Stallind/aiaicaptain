import { COLORS } from '../graphics/palette';
import type { LevelBackground } from './types';

/** Starfield shown behind the title screen. */
export const MENU_BACKGROUND: LevelBackground = {
  color: COLORS.void,
  starSeed: 2026,
  starDensity: 1.2,
};
