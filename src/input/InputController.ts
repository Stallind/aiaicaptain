import type Phaser from 'phaser';
import { ActionState } from './actions';
import type { Action, InputSource } from './actions';
import { GamepadSource } from './GamepadSource';
import { KeyboardSource } from './KeyboardSource';
import { TapSource } from './TapSource';
import { TouchSource } from './TouchSource';

/** The only thing game logic reads input from. Call update() once per frame. */
export class InputController {
  private readonly state = new ActionState();
  private readonly sample = (action: Action): boolean => {
    for (const source of this.sources) {
      if (source.isDown(action)) return true;
    }
    return false;
  };

  constructor(private readonly sources: readonly InputSource[]) {}

  update(): void {
    for (const source of this.sources) source.update?.();
    this.state.update(this.sample);
  }

  isDown(action: Action): boolean {
    return this.state.isDown(action);
  }

  justPressed(action: Action): boolean {
    return this.state.justPressed(action);
  }
}

export interface InputOptions {
  /** Show on-screen buttons when the device has a touch screen. */
  readonly touchButtons: boolean;
  /** If set, a tap or click anywhere counts as this action (menus). */
  readonly tapAnywhereAs?: Action;
}

export function createInput(scene: Phaser.Scene, options: InputOptions): InputController {
  const sources: InputSource[] = [];
  if (scene.input.keyboard) sources.push(new KeyboardSource(scene.input.keyboard));
  if (scene.input.gamepad) sources.push(new GamepadSource(scene.input.gamepad));
  if (options.touchButtons && scene.sys.game.device.input.touch) {
    sources.push(new TouchSource(scene));
  }
  if (options.tapAnywhereAs) sources.push(new TapSource(scene, options.tapAnywhereAs));
  return new InputController(sources);
}
