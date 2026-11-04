import Phaser from 'phaser';
import type { Action } from '../input/actions';

const KeyCodes = Phaser.Input.Keyboard.KeyCodes;

/** The first key of each action is the one named in on-screen hints. */
export const KEY_BINDINGS: Readonly<Record<Action, readonly number[]>> = {
  left: [KeyCodes.LEFT, KeyCodes.A],
  right: [KeyCodes.RIGHT, KeyCodes.D],
  jump: [KeyCodes.SPACE, KeyCodes.UP, KeyCodes.W, KeyCodes.Z],
  // Enter confirms the selected choice in menus; nothing uses this action in play.
  action: [KeyCodes.ENTER, KeyCodes.X, KeyCodes.J],
  pause: [KeyCodes.ESC, KeyCodes.P],
  // Up also jumps; menus with rows check `up` first, so the two never clash.
  up: [KeyCodes.UP, KeyCodes.W],
  down: [KeyCodes.DOWN, KeyCodes.S],
  quit: [KeyCodes.R],
  // P also pauses in play; the sound settings only open from the main menu, where pause does nothing.
  settings: [KeyCodes.P],
};

/** Named buttons Phaser exposes on every pad, whatever its layout. */
export type PadButton = 'A' | 'B' | 'X' | 'Y' | 'up' | 'down' | 'left' | 'right';

export interface GamepadBinding {
  readonly buttons: readonly PadButton[];
  /** Left stick direction that also triggers the action. */
  readonly stickX?: -1 | 1;
  /**
   * Raw button indices, only used on pads reporting the browser's "standard"
   * mapping, where they mean the same physical button on every controller.
   */
  readonly standardButtonIndices?: readonly number[];
}

export const GAMEPAD_BINDINGS: Readonly<Record<Action, GamepadBinding>> = {
  left: { buttons: ['left'], stickX: -1 },
  right: { buttons: ['right'], stickX: 1 },
  jump: { buttons: ['A', 'up'] },
  action: { buttons: ['B', 'X'] },
  // 9 is Start/Options/Menu in the standard mapping.
  pause: { buttons: [], standardButtonIndices: [9] },
  up: { buttons: ['up'] },
  down: { buttons: ['down'] },
  // 8 is Back/Select/Share in the standard mapping.
  quit: { buttons: [], standardButtonIndices: [8] },
  settings: { buttons: ['Y'] },
};

export const GAMEPAD = {
  stickDeadzone: 0.35,
} as const;
