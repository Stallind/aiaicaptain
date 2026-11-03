import Phaser from 'phaser';
import { portraitTextureKey, TEXTURE_KEYS } from '../config/scenes';
import { CHARACTER_SELECT_LAYOUT as L, FONT_FAMILY, FONT_SIZE } from '../config/ui';
import type { PlayerDefinition } from '../content/types';
import { COLORS } from '../graphics/palette';
import { integerFitScale, statPips } from '../utils/stats';

/** Best value per stat among all selectable characters; bars are drawn relative to it. */
export interface StatMaxima {
  readonly speed: number;
  readonly jumpVelocity: number;
}

const color = (hex: string): number => Phaser.Display.Color.HexStringToColor(hex).color;

/** Height of everything under the portrait when the tagline fits on one line. */
const TEXT_AND_STATS_HEIGHT =
  L.nameGap + L.taglineGap + L.statsGap + L.statRowHeight * 2 + L.statsBottomPad;

/**
 * One selectable character: portrait, name, tagline and stat bars inside a
 * frame of fixed height. A tagline that wraps onto more lines takes its room
 * from the portrait, so the card never grows into the touch buttons below.
 */
export class CharacterCard {
  private readonly container: Phaser.GameObjects.Container;
  private readonly frame: Phaser.GameObjects.Rectangle;

  constructor(
    private readonly scene: Phaser.Scene,
    readonly character: PlayerDefinition,
    left: number,
    width: number,
    maxima: StatMaxima,
  ) {
    this.container = scene.add.container(0, 0);
    this.frame = scene.add
      .rectangle(left, L.cardTop, width, L.cardBottom - L.cardTop, color(COLORS.night))
      .setOrigin(0);
    this.container.add(this.frame);

    const centreX = left + width / 2;
    const innerWidth = width - 2 * L.padding;
    const tagline = this.text(centreX, 0, character.tagline, FONT_SIZE.small, innerWidth);
    tagline.setColor(COLORS.steelLight);
    const extraTaglineHeight = (tagline.getWrappedText().length - 1) * L.taglineLineHeight;

    const portraitBox = Math.min(
      L.portraitBox,
      innerWidth,
      L.cardBottom - L.cardTop - L.padding - TEXT_AND_STATS_HEIGHT - extraTaglineHeight,
    );
    const portraitTop = L.cardTop + L.padding;
    this.addPortrait(centreX, portraitTop, portraitBox);

    const nameY = portraitTop + portraitBox + L.nameGap;
    this.text(centreX, nameY, character.displayName.toUpperCase(), FONT_SIZE.body, innerWidth);
    const taglineY = nameY + L.taglineGap;
    tagline.setY(taglineY);
    this.addStats(left + L.padding, taglineY + extraTaglineHeight + L.statsGap, maxima);
  }

  setSelected(selected: boolean): void {
    const border = selected ? COLORS.cyanLight : COLORS.slate;
    this.frame.setStrokeStyle(L.borderWidth, color(border));
    this.container.setAlpha(selected ? 1 : L.dimmedAlpha);
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  private addPortrait(centreX: number, top: number, box: number): void {
    const key = portraitTextureKey(this.character.id);
    const { width, height } = this.scene.textures.getFrame(key);
    const scale = integerFitScale(width, height, box);
    this.container.add(this.scene.add.image(centreX, top + box / 2, key).setScale(scale));
  }

  private addStats(left: number, top: number, maxima: StatMaxima): void {
    const { speed, jumpVelocity, health } = this.character.stats;
    this.addPipRow('SPEED', left, top, statPips(speed, maxima.speed, L.statPips));
    const jumpPips = statPips(jumpVelocity, maxima.jumpVelocity, L.statPips);
    this.addPipRow('JUMP', left, top + L.statRowHeight, jumpPips);
    this.addHeartRow(left, top + L.statRowHeight * 2, health);
  }

  private addPipRow(label: string, left: number, y: number, filled: number): void {
    this.addLabel(label, left, y);
    for (let i = 0; i < L.statPips; i++) {
      const x = left + L.statLabelWidth + i * (L.pipWidth + L.pipGap);
      const fill = i < filled ? COLORS.yellow : COLORS.slate;
      this.container.add(
        this.scene.add.rectangle(x, y, L.pipWidth, L.pipHeight, color(fill)).setOrigin(0, 0.5),
      );
    }
  }

  /** One heart per point of health, or "♥ ×N" when there are too many to fit. */
  private addHeartRow(left: number, y: number, health: number): void {
    this.addLabel('HEALTH', left, y);
    const x = left + L.statLabelWidth;
    const shown = health <= L.maxHeartsShown ? health : 1;
    for (let i = 0; i < shown; i++) {
      this.container.add(
        this.scene.add.image(x + i * L.heartGap, y, TEXTURE_KEYS.heart).setOrigin(0, 0.5),
      );
    }
    if (shown < health) this.addLabel(`×${health}`, x + L.heartGap, y);
  }

  private addLabel(label: string, left: number, y: number): void {
    const text = this.scene.add
      .text(left, y, label, { fontFamily: FONT_FAMILY, fontSize: `${FONT_SIZE.small}px` })
      .setOrigin(0, 0.5)
      .setColor(COLORS.steelLight);
    this.container.add(text);
  }

  private text(
    x: number,
    y: number,
    value: string,
    size: number,
    wrapWidth: number,
  ): Phaser.GameObjects.Text {
    const text = this.scene.add
      .text(x, y, value, {
        fontFamily: FONT_FAMILY,
        fontSize: `${size}px`,
        color: COLORS.white,
        align: 'center',
        wordWrap: { width: wrapWidth, useAdvancedWrap: true },
      })
      .setOrigin(0.5, 0);
    this.container.add(text);
    return text;
  }
}
