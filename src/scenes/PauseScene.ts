import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/scenes';
import { FONT_SIZE, PAUSE_LAYOUT } from '../config/ui';
import { COLORS } from '../graphics/palette';
import { createInput } from '../input/InputController';
import type { InputController } from '../input/InputController';
import { keysFor } from '../input/keyNames';
import { ContinuePrompt } from './ContinuePrompt';
import { addCenteredText, addPrompt, addTextButton } from './textHelpers';

const QUIT_LABEL = 'Change captain';

export class PauseScene extends Phaser.Scene {
  private prompt?: ContinuePrompt;
  private controls?: InputController;
  private quitRequested = false;

  constructor() {
    super(SCENE_KEYS.pause);
  }

  create(): void {
    this.quitRequested = false;
    const { width, height } = this.scale.gameSize;
    const overlay = Phaser.Display.Color.HexStringToColor(COLORS.void).color;
    this.add.rectangle(0, 0, width, height, overlay, PAUSE_LAYOUT.overlayAlpha).setOrigin(0);
    addCenteredText(this, height * PAUSE_LAYOUT.titleY, 'PAUSED', FONT_SIZE.heading);
    const touch = this.sys.game.device.input.touch;
    const hint = touch
      ? 'Tap to resume'
      : `Press ${keysFor('pause', 1)} / ${keysFor('jump', 1)} to resume`;
    addPrompt(this, height * PAUSE_LAYOUT.promptY, hint);
    this.addQuitOption(width / 2, height * PAUSE_LAYOUT.quitY, touch);
    this.prompt = new ContinuePrompt(this, ['pause', 'jump']);
    this.controls = createInput(this, { touchButtons: false });
  }

  override update(): void {
    this.controls?.update();
    // Before the prompt: tapping the button also counts as "tap anywhere to resume".
    if (this.quitRequested || this.controls?.justPressed('quit')) {
      this.quitToCharacterSelect();
    } else if (this.prompt?.update()) {
      this.scene.resume(SCENE_KEYS.game);
      this.scene.stop();
    }
  }

  /** A key hint on keyboards, a button on touch screens (and clickable with a mouse either way). */
  private addQuitOption(x: number, y: number, touch: boolean): void {
    const label = touch ? QUIT_LABEL : `${keysFor('quit', 1)}: ${QUIT_LABEL.toLowerCase()}`;
    addTextButton(this, x, y, label, () => {
      this.quitRequested = true;
    }).setOrigin(0.5);
  }

  /** Leaves the level (its score is dropped) and goes back to choosing a captain. */
  private quitToCharacterSelect(): void {
    this.scene.stop(SCENE_KEYS.game);
    this.scene.start(SCENE_KEYS.characterSelect);
  }
}
