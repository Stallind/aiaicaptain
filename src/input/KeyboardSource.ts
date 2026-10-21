import type Phaser from 'phaser';
import { KEY_BINDINGS } from '../config/input';
import { ACTIONS } from './actions';
import type { Action, InputSource } from './actions';

export class KeyboardSource implements InputSource {
  private readonly keys = new Map<Action, Phaser.Input.Keyboard.Key[]>();

  constructor(keyboard: Phaser.Input.Keyboard.KeyboardPlugin) {
    for (const action of ACTIONS) {
      this.keys.set(
        action,
        KEY_BINDINGS[action].map((code) => keyboard.addKey(code)),
      );
    }
  }

  isDown(action: Action): boolean {
    const keys = this.keys.get(action);
    if (!keys) return false;
    for (const key of keys) {
      if (key.isDown) return true;
    }
    return false;
  }
}
