import Phaser from 'phaser';
import { DEPTH, SCORE_POPUP } from '../config/constants';
import { FONT_FAMILY, FONT_SIZE } from '../config/ui';
import type { EventBus, GameEvents } from '../events/EventBus';
import { COLORS } from '../graphics/palette';

/** Shows "+points" where points were earned. Text objects are pooled and reused. */
export class ScorePopups {
  private readonly pool: Phaser.GameObjects.Group;

  constructor(
    private readonly scene: Phaser.Scene,
    bus: EventBus,
  ) {
    this.pool = scene.add.group({ maxSize: SCORE_POPUP.poolSize });
    bus.on('points:awarded', this.show, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      bus.off('points:awarded', this.show, this);
    });
  }

  private show({ points, x, y }: GameEvents['points:awarded']): void {
    const popup = this.acquire();
    if (!popup) return;
    popup.setText(`+${points}`).setPosition(x, y).setAlpha(1).setActive(true).setVisible(true);
    this.scene.tweens.add({
      targets: popup,
      y: y - SCORE_POPUP.rise,
      alpha: 0,
      duration: SCORE_POPUP.durationMs,
      onComplete: () => popup.setActive(false).setVisible(false),
    });
  }

  private acquire(): Phaser.GameObjects.Text | null {
    const free: unknown = this.pool.getFirstDead(false);
    if (free instanceof Phaser.GameObjects.Text) return free;
    if (this.pool.isFull()) return null;
    const text = this.scene.add
      .text(0, 0, '', {
        fontFamily: FONT_FAMILY,
        fontSize: `${FONT_SIZE.small}px`,
        color: COLORS.yellow,
      })
      .setOrigin(0.5, 1)
      .setDepth(DEPTH.popups);
    this.pool.add(text);
    return text;
  }
}
