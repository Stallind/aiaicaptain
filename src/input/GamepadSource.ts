import type Phaser from 'phaser';
import { GAMEPAD, GAMEPAD_BINDINGS } from '../config/input';
import type { GamepadBinding } from '../config/input';
import type { Action, InputSource } from './actions';

/** Uses the first connected pad, so plugging one in mid-game just works. */
export class GamepadSource implements InputSource {
  constructor(private readonly plugin: Phaser.Input.Gamepad.GamepadPlugin) {}

  isDown(action: Action): boolean {
    const pad = this.plugin.pad1;
    if (!pad) return false;
    const binding = GAMEPAD_BINDINGS[action];
    return (
      namedButtonDown(pad, binding) || stickDown(pad, binding) || indexedButtonDown(pad, binding)
    );
  }
}

function namedButtonDown(pad: Phaser.Input.Gamepad.Gamepad, binding: GamepadBinding): boolean {
  for (const button of binding.buttons) {
    if (pad[button]) return true;
  }
  return false;
}

function stickDown(pad: Phaser.Input.Gamepad.Gamepad, binding: GamepadBinding): boolean {
  if (binding.stickX === undefined) return false;
  return pad.leftStick.x * binding.stickX > GAMEPAD.stickDeadzone;
}

/** Raw indices differ between controllers unless the browser reports the standard layout. */
function indexedButtonDown(pad: Phaser.Input.Gamepad.Gamepad, binding: GamepadBinding): boolean {
  const indices = binding.standardButtonIndices;
  if (!indices || !hasStandardMapping(pad)) return false;
  for (const index of indices) {
    if (pad.buttons[index]?.pressed) return true;
  }
  return false;
}

function hasStandardMapping(pad: Phaser.Input.Gamepad.Gamepad): boolean {
  // Phaser types the native Gamepad as `any`; read only the one field we need.
  const native: unknown = pad.pad;
  return (
    typeof native === 'object' &&
    native !== null &&
    'mapping' in native &&
    native.mapping === 'standard'
  );
}
