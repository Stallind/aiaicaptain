import Phaser from 'phaser';
import { DEPTH, TOUCH_CONTROLS } from '../config/constants';
import type { TouchButtonSpec } from '../config/constants';
import { FONT_FAMILY } from '../config/ui';
import { COLORS } from '../graphics/palette';
import { touchButtonCentre } from '../utils/touchLayout';
import type { Action, InputSource } from './actions';

interface TouchButton {
  readonly action: Action;
  readonly circle: Phaser.GameObjects.Arc;
  pressed: boolean;
}

/**
 * On-screen buttons, laid out from TOUCH_CONTROLS.buttons. Every active pointer
 * is tested against every button each frame, which handles multi-touch and
 * sliding a thumb between buttons. The number of tracked fingers is set once in
 * the game config (input.activePointers).
 */
export class TouchSource implements InputSource {
  private readonly buttons: TouchButton[];

  constructor(private readonly scene: Phaser.Scene) {
    this.buttons = TOUCH_CONTROLS.buttons.map((spec) => this.createButton(spec));
  }

  update(): void {
    const pointers = this.scene.input.manager.pointers;
    for (const button of this.buttons) {
      button.pressed = false;
      for (const pointer of pointers) {
        const { x, y, radius } = button.circle;
        if (pointer.isDown && Phaser.Math.Distance.Between(pointer.x, pointer.y, x, y) <= radius) {
          button.pressed = true;
          break;
        }
      }
      button.circle.setAlpha(button.pressed ? TOUCH_CONTROLS.activeAlpha : TOUCH_CONTROLS.alpha);
    }
  }

  isDown(action: Action): boolean {
    for (const button of this.buttons) {
      if (button.action === action && button.pressed) return true;
    }
    return false;
  }

  private createButton(spec: TouchButtonSpec): TouchButton {
    const { width, height } = this.scene.scale.gameSize;
    const radius = TOUCH_CONTROLS.buttonRadius * spec.size;
    const { x, y } = touchButtonCentre({
      anchor: spec.anchor,
      slot: spec.slot,
      radius,
      slotRadius: TOUCH_CONTROLS.buttonRadius,
      margin: TOUCH_CONTROLS.margin,
      screenWidth: width,
      screenHeight: height,
    });
    const fill = Phaser.Display.Color.HexStringToColor(COLORS.steelLight).color;
    const circle = this.scene.add
      .circle(x, y, radius, fill, TOUCH_CONTROLS.alpha)
      .setScrollFactor(0)
      .setDepth(DEPTH.touchControls);
    this.scene.add
      .text(x, y, spec.label, {
        fontFamily: FONT_FAMILY,
        fontSize: `${Math.round(radius * TOUCH_CONTROLS.labelScale)}px`,
        color: COLORS.void,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH.touchControls);
    return { action: spec.action, circle, pressed: false };
  }
}
