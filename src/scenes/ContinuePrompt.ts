import type Phaser from 'phaser';
import { TIMING } from '../config/constants';
import { createInput } from '../input/InputController';
import type { InputController } from '../input/InputController';
import type { Action } from '../input/actions';

/** A tap or click anywhere counts as this action, so every prompt accepts it. */
const TAP_ACTION: Action = 'action';

/**
 * Waits for one of the given actions (or a tap), ignoring input for a short
 * grace period so a key still held from the previous screen doesn't trigger it.
 */
export class ContinuePrompt {
  private readonly input: InputController;
  private readonly readyAt: number;
  private readonly actions: readonly Action[];

  constructor(
    private readonly scene: Phaser.Scene,
    actions: readonly Action[] = ['jump'],
  ) {
    this.input = createInput(scene, { touchButtons: false, tapAnywhereAs: TAP_ACTION });
    this.actions = [...actions, TAP_ACTION];
    this.readyAt = scene.time.now + TIMING.inputGraceMs;
  }

  /** Call every frame; returns true once when the player wants to continue. */
  update(): boolean {
    this.input.update();
    return this.scene.time.now >= this.readyAt && this.anyActionPressed();
  }

  private anyActionPressed(): boolean {
    for (const action of this.actions) {
      if (this.input.justPressed(action)) return true;
    }
    return false;
  }
}
