import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/scenes';
import { CORNER_BUTTON, FONT_SIZE, MENU_LAYOUT } from '../config/ui';
import { MENU_BACKGROUND } from '../content/menu';
import { PLAYER_CHARACTERS, isPlayerCharacter } from '../content/registry';
import { COLORS } from '../graphics/palette';
import { playIfExists } from '../entities/physicsSprite';
import { ParallaxBackground } from '../systems/ParallaxBackground';
import { startMusic } from '../systems/audio';
import { storageOf } from '../systems/sharedStorage';
import { createInput } from '../input/InputController';
import type { InputController } from '../input/InputController';
import { keysFor } from '../input/keyNames';
import { ContinuePrompt } from './ContinuePrompt';
import { addCenteredText, addPrompt, addTextButton } from './textHelpers';

export class MenuScene extends Phaser.Scene {
  private background?: ParallaxBackground;
  private prompt?: ContinuePrompt;
  private controls?: InputController;
  private settingsRequested = false;

  constructor() {
    super(SCENE_KEYS.menu);
  }

  create(): void {
    this.background = new ParallaxBackground(this, MENU_BACKGROUND);
    this.settingsRequested = false;
    startMusic(this);
    const { width, height } = this.scale.gameSize;
    const touch = this.sys.game.device.input.touch;
    const titleY = height * MENU_LAYOUT.titleY;

    addCenteredText(this, titleY, 'AI AI CAPTAIN', FONT_SIZE.title, COLORS.orange);
    addCenteredText(
      this,
      titleY + MENU_LAYOUT.subtitleGap,
      'a space platformer',
      FONT_SIZE.body,
      COLORS.steelLight,
    );

    const heroId = this.heroId();
    const hero = this.add
      .sprite(width / 2, height * MENU_LAYOUT.heroY, heroId, 0)
      .setScale(MENU_LAYOUT.heroScale)
      .setScrollFactor(0);
    playIfExists(hero, heroId, 'run');

    const startHint = touch ? 'Tap to start' : `Press ${keysFor('jump', 1)} to start`;
    addPrompt(this, height * MENU_LAYOUT.promptY, startHint);
    const controls = touch
      ? 'Use the on-screen buttons'
      : `Move: ${keysFor('left')} and ${keysFor('right')}    Jump: ${keysFor('jump')}    Pause: ${keysFor('pause', 1)}    Sound: ${keysFor('settings', 1)}`;
    addCenteredText(this, height * MENU_LAYOUT.controlsY, controls, FONT_SIZE.small, COLORS.steel);
    const highscore = `Highscore ${storageOf(this).getHighscore()}`;
    addCenteredText(
      this,
      height * MENU_LAYOUT.highscoreY,
      highscore,
      FONT_SIZE.small,
      COLORS.yellow,
    );

    this.addSoundButton();
    this.prompt = new ContinuePrompt(this);
    this.controls = createInput(this, { touchButtons: false });
  }

  override update(time: number): void {
    this.cameras.main.scrollX = time * MENU_LAYOUT.scrollSpeed;
    this.background?.update(this.cameras.main);
    this.controls?.update();
    // Before the prompt: tapping the SOUND button also counts as "tap anywhere to start".
    if (this.settingsRequested || this.controls?.justPressed('settings')) {
      this.scene.start(SCENE_KEYS.settings);
    } else if (this.prompt?.update()) {
      this.scene.start(SCENE_KEYS.characterSelect);
    }
  }

  private addSoundButton(): void {
    const { width } = this.scale.gameSize;
    addTextButton(this, width - CORNER_BUTTON.margin, CORNER_BUTTON.margin, 'SOUND', () => {
      this.settingsRequested = true;
    }).setOrigin(1, 0);
  }

  /** Shows the character picked last time, or the first one on a first visit. */
  private heroId(): string {
    const remembered = storageOf(this).getSelectedCharacter();
    if (remembered && isPlayerCharacter(remembered)) return remembered;
    const first = PLAYER_CHARACTERS[0];
    if (!first) throw new Error('No player characters registered');
    return first.id;
  }
}
