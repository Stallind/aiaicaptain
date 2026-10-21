import type Phaser from 'phaser';
import type { Action, InputSource } from './actions';

/**
 * Treats a touch or click anywhere on the screen as one action, for "tap to
 * continue" screens. Polls pointers instead of listening to events, so there
 * is nothing to clean up when the scene stops.
 */
export class TapSource implements InputSource {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly action: Action,
  ) {}

  isDown(action: Action): boolean {
    if (action !== this.action) return false;
    for (const pointer of this.scene.input.manager.pointers) {
      if (pointer.isDown) return true;
    }
    return false;
  }
}
