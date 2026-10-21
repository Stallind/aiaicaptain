import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/scenes';
import { FONT_SIZE, MENU_LAYOUT } from '../config/ui';
import { MENU_BACKGROUND } from '../content/menu';
import { firstLevelId, getLevel, playerCharacterOf } from '../content/registry';
import { COLORS } from '../graphics/palette';
import { playIfExists } from '../entities/physicsSprite';
import { ParallaxBackground } from '../systems/ParallaxBackground';
import { createGameStorage } from '../systems/storage';
import { ContinuePrompt } from './ContinuePrompt';
import type { GameSceneData } from './sceneData';
import { addCenteredText, addPrompt } from './textHelpers';

export class MenuScene extends Phaser.Scene {
  private background?: ParallaxBackground;
  private prompt?: ContinuePrompt;

  constructor() {
    super(SCENE_KEYS.menu);
  }

  create(): void {
    this.background = new ParallaxBackground(this, MENU_BACKGROUND);
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

    const heroId = playerCharacterOf(getLevel(firstLevelId())).id;
    const hero = this.add
      .sprite(width / 2, height * MENU_LAYOUT.heroY, heroId, 0)
      .setScale(MENU_LAYOUT.heroScale)
      .setScrollFactor(0);
    playIfExists(hero, heroId, 'run');

    const startHint = touch ? 'Tap to start' : 'Press SPACE / A to start';
    addPrompt(this, height * MENU_LAYOUT.promptY, startHint);
    const controls = touch
      ? 'Use the on-screen buttons'
      : 'Move: arrows / A D    Jump: SPACE / W    Pause: ESC';
    addCenteredText(this, height * MENU_LAYOUT.controlsY, controls, FONT_SIZE.small, COLORS.steel);
    const highscore = `Highscore ${createGameStorage().getHighscore()}`;
    addCenteredText(
      this,
      height * MENU_LAYOUT.highscoreY,
      highscore,
      FONT_SIZE.small,
      COLORS.yellow,
    );

    this.prompt = new ContinuePrompt(this);
  }

  override update(time: number): void {
    this.cameras.main.scrollX = time * MENU_LAYOUT.scrollSpeed;
    this.background?.update(this.cameras.main);
    if (this.prompt?.update()) {
      const data: GameSceneData = { levelId: firstLevelId(), score: 0 };
      this.scene.start(SCENE_KEYS.game, data);
    }
  }
}
