import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/scenes';
import { FONT_SIZE, GAME_OVER_LAYOUT } from '../config/ui';
import { COLORS } from '../graphics/palette';
import { createGameStorage } from '../systems/storage';
import { ContinuePrompt } from './ContinuePrompt';
import { parseGameOverSceneData } from './sceneData';
import { addCenteredText, addPrompt, primaryControlsHint } from './textHelpers';

export class GameOverScene extends Phaser.Scene {
  private prompt?: ContinuePrompt;

  constructor() {
    super(SCENE_KEYS.gameOver);
  }

  create(rawData: unknown): void {
    const data = parseGameOverSceneData(rawData);
    const { height } = this.scale.gameSize;
    const storage = createGameStorage();
    const isRecord = storage.submitScore(data.score);
    const titleY = height * GAME_OVER_LAYOUT.titleY;
    const scoreY = height * GAME_OVER_LAYOUT.scoreY;

    this.cameras.main.setBackgroundColor(COLORS.void);
    const title = data.won ? 'MISSION COMPLETE' : 'GAME OVER';
    const titleColor = data.won ? COLORS.green : COLORS.red;
    addCenteredText(this, titleY, title, FONT_SIZE.heading, titleColor);
    const subtitle = data.won ? 'You made it through every sector!' : `Lost in ${data.levelName}`;
    const subtitleY = titleY + GAME_OVER_LAYOUT.subtitleGap;
    addCenteredText(this, subtitleY, subtitle, FONT_SIZE.body, COLORS.steelLight);
    addCenteredText(this, scoreY, `SCORE ${data.score}`, FONT_SIZE.score, COLORS.yellow);
    const best = isRecord ? 'NEW HIGHSCORE!' : `Highscore ${storage.getHighscore()}`;
    const bestColor = isRecord ? COLORS.orange : COLORS.steel;
    const bestY = scoreY + GAME_OVER_LAYOUT.highscoreGap;
    addCenteredText(this, bestY, best, FONT_SIZE.body, bestColor);
    addPrompt(this, height * GAME_OVER_LAYOUT.promptY, primaryControlsHint(this));

    this.prompt = new ContinuePrompt(this);
  }

  override update(): void {
    if (this.prompt?.update()) this.scene.start(SCENE_KEYS.menu);
  }
}
