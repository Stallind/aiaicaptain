import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/scenes';
import { FONT_SIZE, PAUSE_LAYOUT } from '../config/ui';
import { COLORS } from '../graphics/palette';
import { keysFor } from '../input/keyNames';
import { ContinuePrompt } from './ContinuePrompt';
import { addCenteredText, addPrompt } from './textHelpers';

export class PauseScene extends Phaser.Scene {
  private prompt?: ContinuePrompt;

  constructor() {
    super(SCENE_KEYS.pause);
  }

  create(): void {
    const { width, height } = this.scale.gameSize;
    const overlay = Phaser.Display.Color.HexStringToColor(COLORS.void).color;
    this.add.rectangle(0, 0, width, height, overlay, PAUSE_LAYOUT.overlayAlpha).setOrigin(0);
    addCenteredText(this, height * PAUSE_LAYOUT.titleY, 'PAUSED', FONT_SIZE.heading);
    const hint = this.sys.game.device.input.touch
      ? 'Tap to resume'
      : `Press ${keysFor('pause', 1)} / ${keysFor('jump', 1)} to resume`;
    addPrompt(this, height * PAUSE_LAYOUT.promptY, hint);
    this.prompt = new ContinuePrompt(this, ['pause', 'jump']);
  }

  override update(): void {
    if (this.prompt?.update()) {
      this.scene.resume(SCENE_KEYS.game);
      this.scene.stop();
    }
  }
}
