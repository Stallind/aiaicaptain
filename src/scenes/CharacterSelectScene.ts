import Phaser from 'phaser';
import { TIMING } from '../config/constants';
import { SCENE_KEYS } from '../config/scenes';
import { CHARACTER_SELECT_LAYOUT as L, FONT_SIZE } from '../config/ui';
import { MENU_BACKGROUND } from '../content/menu';
import { firstLevelId, PLAYER_CHARACTERS } from '../content/registry';
import { COLORS } from '../graphics/palette';
import { createInput } from '../input/InputController';
import type { InputController } from '../input/InputController';
import { keysFor } from '../input/keyNames';
import { ParallaxBackground } from '../systems/ParallaxBackground';
import { storageOf } from '../systems/sharedStorage';
import { cycleIndex, layoutCardRow, pageOf } from '../utils/stats';
import { CharacterCard } from './CharacterCard';
import type { GameSceneData } from './sceneData';
import { addCenteredText, addPrompt } from './textHelpers';

/**
 * Lists every player character from the registry; left/right to choose, jump to
 * start. Up to `cardsPerPage` cards share the screen; more are paged.
 */
export class CharacterSelectScene extends Phaser.Scene {
  private cards: CharacterCard[] = [];
  private selected = 0;
  private controls!: InputController;
  private pageIndicator?: Phaser.GameObjects.Text;
  private readyAt = 0;

  constructor() {
    super(SCENE_KEYS.characterSelect);
  }

  create(): void {
    // BootScene already refuses to start without player characters; this guards direct starts.
    if (PLAYER_CHARACTERS.length === 0) throw new Error('No player characters to choose from');
    new ParallaxBackground(this, MENU_BACKGROUND);
    addCenteredText(this, L.titleY, 'CHOOSE YOUR CAPTAIN', FONT_SIZE.banner, COLORS.orange);
    this.cards = this.createCards();
    if (this.cards.length > L.cardsPerPage) {
      this.pageIndicator = addCenteredText(
        this,
        L.pageIndicatorY,
        '',
        FONT_SIZE.small,
        COLORS.steel,
      );
    }
    this.selected = this.initialSelection();
    this.refresh();
    // Touch devices get the same on-screen buttons as in the game: < > choose, A starts, II goes back.
    this.controls = createInput(this, { touchButtons: true });
    addPrompt(this, this.scale.gameSize.height * L.promptY, this.hint());
    this.readyAt = this.time.now + TIMING.inputGraceMs;
  }

  override update(): void {
    this.controls.update();
    if (this.time.now < this.readyAt) return;
    if (this.controls.justPressed('left')) this.move(-1);
    else if (this.controls.justPressed('right')) this.move(1);
    else if (this.controls.justPressed('jump') || this.controls.justPressed('action')) this.start();
    else if (this.controls.justPressed('pause')) this.scene.start(SCENE_KEYS.menu);
  }

  /** Cards on the same page share a row; every page is laid out like the first. */
  private createCards(): CharacterCard[] {
    const maxima = {
      speed: Math.max(...PLAYER_CHARACTERS.map((c) => c.stats.speed)),
      jumpVelocity: Math.max(...PLAYER_CHARACTERS.map((c) => c.stats.jumpVelocity)),
    };
    const row = layoutCardRow(Math.min(PLAYER_CHARACTERS.length, L.cardsPerPage), {
      screenWidth: this.scale.gameSize.width,
      maxCardWidth: L.cardWidth,
      gap: L.cardGap,
      sideMargin: L.sideMargin,
    });
    return PLAYER_CHARACTERS.map((character, i) => {
      const left = row.lefts[i % L.cardsPerPage] ?? 0;
      return new CharacterCard(this, character, left, row.cardWidth, maxima);
    });
  }

  private initialSelection(): number {
    const remembered = storageOf(this).getSelectedCharacter();
    const index = this.cards.findIndex((card) => card.character.id === remembered);
    return index >= 0 ? index : 0;
  }

  private move(step: -1 | 1): void {
    this.selected = cycleIndex(this.selected, step, this.cards.length);
    this.refresh();
  }

  private refresh(): void {
    const { page, first, last } = pageOf(this.selected, L.cardsPerPage, this.cards.length);
    this.cards.forEach((card, i) => {
      card.setVisible(i >= first && i <= last);
      card.setSelected(i === this.selected);
    });
    const pages = Math.ceil(this.cards.length / L.cardsPerPage);
    this.pageIndicator?.setText(`< page ${page + 1} of ${pages} >`);
  }

  private start(): void {
    const card = this.cards[this.selected];
    if (!card) return;
    storageOf(this).setSelectedCharacter(card.character.id);
    const data: GameSceneData = { levelId: firstLevelId(), score: 0, playerId: card.character.id };
    this.scene.start(SCENE_KEYS.game, data);
  }

  private hint(): string {
    if (this.sys.game.device.input.touch) return '< > choose    A start    II back';
    const move = `${keysFor('left', 1)} / ${keysFor('right', 1)}`;
    return `${move} to choose    ${keysFor('jump', 1)} to start    ${keysFor('pause', 1)} back`;
  }
}
