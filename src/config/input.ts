import Phaser from 'phaser';
import type { Action } from '../input/actions';

const KeyCodes = Phaser.Input.Keyboard.KeyCodes;

/** The first key of each action is the one named in on-screen hints. */
export const KEY_BINDINGS: Readonly<Record<Action, readonly number[]>> = {
  left: [KeyCodes.LEFT, KeyCodes.A],
  right: [KeyCodes.RIGHT, KeyCodes.D],
  jump: [KeyCodes.SPACE, KeyCodes.UP, KeyCodes.W, KeyCodes.Z],
  action: [KeyCodes.X, KeyCodes.J],
  pause: [KeyCodes.ESC, KeyCodes.P],
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
};

export const GAMEPAD = {
  stickDeadzone: 0.35,
} as const;
