import type Phaser from 'phaser';
import { GAMEPAD } from '../config/input';
import type { Action, InputSource } from './actions';

/** Uses the first connected pad, so plugging one in mid-game just works. */
export class GamepadSource implements InputSource {
  constructor(private readonly plugin: Phaser.Input.Gamepad.GamepadPlugin) {}

  isDown(action: Action): boolean {
    const pad = this.plugin.pad1;
    if (!pad) return false;
    switch (action) {
      case 'left':
        return pad.left || pad.leftStick.x < -GAMEPAD.stickDeadzone;
      case 'right':
        return pad.right || pad.leftStick.x > GAMEPAD.stickDeadzone;
      case 'jump':
        return pad.A || pad.up;
      case 'action':
        return pad.B || pad.X;
      case 'pause':
        return pad.buttons[GAMEPAD.startButtonIndex]?.pressed ?? false;
    }
  }
}
