import Phaser from 'phaser';
import { CORNER_BUTTON, FONT_FAMILY, FONT_SIZE, PROMPT_PULSE } from '../config/ui';
import { COLORS } from '../graphics/palette';
import { keysFor } from '../input/keyNames';

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
  if (scene.sys.game.device.input.touch) return 'Tap to continue';
  return `Press ${keysFor('jump', 1)} to continue`;
}

/**
 * A clickable/tappable label. `onPress` should only set a flag that the scene's
 * update() acts on: a tap also counts as "tap anywhere" on prompt screens, so
 * update() must check the button first to decide which one wins.
 */
export function addTextButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onPress: () => void,
): Phaser.GameObjects.Text {
  const button = scene.add
    .text(x, y, label, {
      fontFamily: FONT_FAMILY,
      fontSize: `${FONT_SIZE.body}px`,
      color: COLORS.cyanLight,
      backgroundColor: COLORS.night,
      padding: { x: CORNER_BUTTON.paddingX, y: CORNER_BUTTON.paddingY },
    })
    .setScrollFactor(0)
    .setInteractive({ useHandCursor: true });
  button.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, onPress);
  return button;
}
