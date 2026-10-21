import type Phaser from 'phaser';
import { FONT_FAMILY, FONT_SIZE, PROMPT_PULSE } from '../config/ui';
import { COLORS } from '../graphics/palette';

export function addCenteredText(
  scene: Phaser.Scene,
  y: number,
  text: string,
  size: number,
  color: string = COLORS.white,
): Phaser.GameObjects.Text {
  return scene.add
    .text(scene.scale.gameSize.width / 2, y, text, {
      fontFamily: FONT_FAMILY,
      fontSize: `${size}px`,
      color,
      align: 'center',
    })
    .setOrigin(0.5)
    .setScrollFactor(0);
}

/** Text that pulses gently, for "press to continue" prompts. */
export function addPrompt(scene: Phaser.Scene, y: number, text: string): Phaser.GameObjects.Text {
  const prompt = addCenteredText(scene, y, text, FONT_SIZE.body, COLORS.cyanLight);
  scene.tweens.add({
    targets: prompt,
    alpha: PROMPT_PULSE.minAlpha,
    duration: PROMPT_PULSE.durationMs,
    yoyo: true,
    repeat: -1,
  });
  return prompt;
}

export function primaryControlsHint(scene: Phaser.Scene): string {
  return scene.sys.game.device.input.touch ? 'Tap to continue' : 'Press SPACE / A to continue';
}
