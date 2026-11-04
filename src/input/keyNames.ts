import Phaser from 'phaser';
import { KEY_BINDINGS } from '../config/input';
import type { Action } from './actions';

// KeyCodes maps NAME -> code; hints need code -> NAME. The first name wins for aliased codes.
const NAMES_BY_CODE: ReadonlyMap<number, string> = new Map(
  Object.entries(Phaser.Input.Keyboard.KeyCodes)
    .reverse()
    .map(([name, code]) => [code, name]),
);

/** Human-readable key names for an action, e.g. "SPACE / UP", taken from KEY_BINDINGS. */
export function keysFor(action: Action, max = 2): string {
  return KEY_BINDINGS[action]
    .slice(0, max)
    .map((code) => NAMES_BY_CODE.get(code) ?? `KEY ${code}`)
    .join(' / ');
}
