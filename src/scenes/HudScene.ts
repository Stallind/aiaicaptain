import Phaser from 'phaser';
import { HUD } from '../config/constants';
import { SCENE_KEYS, TEXTURE_KEYS } from '../config/scenes';
import { EventBus } from '../events/EventBus';
import type { GameEvents } from '../events/EventBus';
import { COLORS } from '../graphics/palette';
import { FONT_FAMILY, FONT_SIZE } from '../config/ui';
import { parseHudSceneData } from './sceneData';
import { addCenteredText } from './textHelpers';

/** Runs on top of the game scene and only listens to events; it never touches game objects. */
export class HudScene extends Phaser.Scene {
  private hearts: Phaser.GameObjects.Image[] = [];
  private scoreText?: Phaser.GameObjects.Text;
  private bus?: EventBus;

  constructor() {
    super(SCENE_KEYS.hud);
  }

  create(rawData: unknown): void {
    const data = parseHudSceneData(rawData);
    this.bus = EventBus.of(this);
    this.createHearts(data.maxHealth);
    this.setHealth(data.health);
    this.scoreText = this.add
      .text(this.scale.gameSize.width - HUD.margin, HUD.margin, '', {
        fontFamily: FONT_FAMILY,
        fontSize: `${FONT_SIZE.body}px`,
        color: COLORS.yellow,
      })
      .setOrigin(1, 0);
    this.setScore(data.score);
    this.showLevelBanner(data.levelName);

    this.bus.on('score:changed', this.onScore, this);
    this.bus.on('health:changed', this.onHealth, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.bus?.off('score:changed', this.onScore, this);
      this.bus?.off('health:changed', this.onHealth, this);
    });
  }

  private onScore(payload: GameEvents['score:changed']): void {
    this.setScore(payload.score);
  }

  private onHealth(payload: GameEvents['health:changed']): void {
    this.setHealth(payload.health);
  }

  private createHearts(max: number): void {
    this.hearts = Array.from({ length: max }, (_, i) =>
      this.add
        .image(HUD.margin + i * HUD.heartSpacing, HUD.margin, TEXTURE_KEYS.heart)
        .setOrigin(0)
        .setScale(HUD.heartScale),
    );
  }

  private setHealth(health: number): void {
    this.hearts.forEach((heart, i) =>
      heart.setTexture(i < health ? TEXTURE_KEYS.heart : TEXTURE_KEYS.heartEmpty),
    );
  }

  private setScore(score: number): void {
    this.scoreText?.setText(`SCORE ${score}`);
  }

  private showLevelBanner(name: string): void {
    const banner = addCenteredText(
      this,
      this.scale.gameSize.height * HUD.levelBannerY,
      name.toUpperCase(),
      FONT_SIZE.banner,
      COLORS.cyanLight,
    );
    this.tweens.add({
      targets: banner,
      alpha: 0,
      delay: HUD.levelBannerMs,
      duration: HUD.levelBannerFadeMs,
      onComplete: () => banner.destroy(),
    });
  }
}
