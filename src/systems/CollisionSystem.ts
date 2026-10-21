import type Phaser from 'phaser';
import { PLAYER_TUNING, SCORE, WORLD_LIMITS } from '../config/constants';
import { ComboCounter } from '../components/ComboCounter';
import { Collectible } from '../entities/Collectible';
import { Enemy } from '../entities/Enemy';
import type { EventBus } from '../events/EventBus';
import { isStomp } from '../utils/combat';
import type { LevelWorld } from './LevelBuilder';
import type { ScoreSystem } from './ScoreSystem';

export interface CollisionCallbacks {
  /** The player lost health (may now be dead). */
  onPlayerDamaged(): void;
  /** The player fell below the level and is lost. */
  onPlayerFell(): void;
  onGoalReached(): void;
}

/** Wires up all physics interactions in a level and applies the game rules for them. */
export class CollisionSystem {
  private readonly combo = new ComboCounter(SCORE.maxComboMultiplier);

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly levelWorld: LevelWorld,
    private readonly score: ScoreSystem,
    private readonly bus: EventBus,
    private readonly callbacks: CollisionCallbacks,
  ) {
    const physics = scene.physics.add;
    const { player, ground, enemies, collectibles, goals } = levelWorld;
    physics.collider(player, ground);
    physics.collider(enemies, ground);
    physics.overlap(player, enemies, (_p, other) => {
      if (other instanceof Enemy) this.onEnemyContact(other);
    });
    physics.overlap(player, collectibles, (_p, other) => {
      if (other instanceof Collectible) this.onCollect(other);
    });
    physics.overlap(player, goals, () => callbacks.onGoalReached());
  }

  /** Rules that are not physics overlaps. Call once per frame while the level is being played. */
  update(time: number): void {
    if (this.levelWorld.player.onGround) this.combo.reset();
    this.checkHazardTiles(time);
    this.checkFellOutOfLevel();
  }

  private checkHazardTiles(time: number): void {
    const { player, ground, hazardIndexes } = this.levelWorld;
    const tile = ground.getTileAtWorldXY(player.x, player.feetY - 1);
    if (!tile || !hazardIndexes.has(tile.index)) return;
    // Knock the player away from the centre of the hazard tile.
    if (player.hurt(tile.getCenterX(), time)) this.callbacks.onPlayerDamaged();
  }

  private checkFellOutOfLevel(): void {
    const { player, map } = this.levelWorld;
    if (player.y > map.heightInPixels + WORLD_LIMITS.playerFallMargin && !player.health.isDead) {
      player.health.kill();
      this.callbacks.onPlayerFell();
    }
  }

  private onEnemyContact(enemy: Enemy): void {
    if (this.isStompOn(enemy)) {
      this.stomp(enemy);
    } else if (this.levelWorld.player.hurt(enemy.x, this.scene.time.now)) {
      this.callbacks.onPlayerDamaged();
    }
  }

  private isStompOn(enemy: Enemy): boolean {
    const { player } = this.levelWorld;
    return (
      enemy.definition.stompable &&
      isStomp({
        playerBottom: player.feetY,
        playerVelocityY: player.velocityY,
        enemyTop: enemy.bodyTop,
        tolerance: PLAYER_TUNING.stompTolerance,
      })
    );
  }

  private stomp(enemy: Enemy): void {
    const points = this.combo.stomp(enemy.definition.scoreValue);
    enemy.defeat();
    this.levelWorld.player.bounce();
    this.award(points, enemy.x, enemy.y - enemy.height);
  }

  private onCollect(item: Collectible): void {
    item.collect();
    this.award(item.definition.scoreValue, item.x, item.y - item.height);
  }

  private award(points: number, x: number, y: number): void {
    this.score.add(points);
    this.bus.emit('points:awarded', { points, x, y });
  }
}
