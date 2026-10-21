import Phaser from 'phaser';
import type { Action } from '../input/actions';

const KeyCodes = Phaser.Input.Keyboard.KeyCodes;

export const KEY_BINDINGS: Readonly<Record<Action, readonly number[]>> = {
  left: [KeyCodes.LEFT, KeyCodes.A],
  right: [KeyCodes.RIGHT, KeyCodes.D],
  jump: [KeyCodes.SPACE, KeyCodes.UP, KeyCodes.W, KeyCodes.Z],
  action: [KeyCodes.X, KeyCodes.J],
  pause: [KeyCodes.ESC, KeyCodes.P],
};

export const GAMEPAD = {
  stickDeadzone: 0.35,
  startButtonIndex: 9,
} as const;
