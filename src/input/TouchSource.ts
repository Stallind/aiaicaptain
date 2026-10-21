import Phaser from 'phaser';
import { DEPTH, TOUCH_CONTROLS } from '../config/constants';
import { FONT_FAMILY } from '../config/ui';
import { COLORS } from '../graphics/palette';
import type { Action, InputSource } from './actions';

interface TouchButton {
  readonly action: Action;
  readonly circle: Phaser.GameObjects.Arc;
  pressed: boolean;
}

/**
 * On-screen buttons. Every active pointer is tested against every button each
 * frame, which handles multi-touch and sliding a thumb between buttons.
 */
export class TouchSource implements InputSource {
  private readonly buttons: TouchButton[];

  constructor(private readonly scene: Phaser.Scene) {
    scene.input.addPointer(2);
    const { width, height } = scene.scale.gameSize;
    const radius = TOUCH_CONTROLS.buttonRadius;
    const margin = TOUCH_CONTROLS.margin;
    const bottomRowY = height - margin - radius;
    const pauseRadius = radius / 2;
    this.buttons = [
      this.createButton('left', margin + radius, bottomRowY, radius, '<'),
      this.createButton('right', margin * 2 + radius * 3, bottomRowY, radius, '>'),
      this.createButton('jump', width - margin - radius, bottomRowY, radius, 'A'),
      this.createButton(
        'pause',
        width - margin - pauseRadius,
        margin + pauseRadius,
        pauseRadius,
        'II',
      ),
    ];
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

  private createButton(
    action: Action,
    x: number,
    y: number,
    radius: number,
    label: string,
  ): TouchButton {
    const fill = Phaser.Display.Color.HexStringToColor(COLORS.steelLight).color;
    const circle = this.scene.add
      .circle(x, y, radius, fill, TOUCH_CONTROLS.alpha)
      .setScrollFactor(0)
      .setDepth(DEPTH.touchControls);
    this.scene.add
      .text(x, y, label, {
        fontFamily: FONT_FAMILY,
        fontSize: `${Math.round(radius * TOUCH_CONTROLS.labelScale)}px`,
        color: COLORS.void,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH.touchControls);
    return { action, circle, pressed: false };
  }
}
