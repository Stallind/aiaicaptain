import Phaser from 'phaser';
import { CAMERA, SCORE, TIMING, WORLD_LIMITS } from '../config/constants';
import { SCENE_KEYS } from '../config/scenes';
import { firstLevelId, getLevel, hasLevel } from '../content/registry';
import type { LevelDefinition } from '../content/types';
import { EventBus } from '../events/EventBus';
import { createInput } from '../input/InputController';
import type { InputController } from '../input/InputController';
import { CollisionSystem } from '../systems/CollisionSystem';
import { buildLevel } from '../systems/LevelBuilder';
import type { LevelWorld } from '../systems/LevelBuilder';
import { ParallaxBackground } from '../systems/ParallaxBackground';
import { ScorePopups } from '../systems/ScorePopups';
import { ScoreSystem } from '../systems/ScoreSystem';
import { parseGameSceneData } from './sceneData';
import type { GameOverSceneData, GameSceneData, HudSceneData } from './sceneData';

type PlayState = 'playing' | 'dying' | 'complete';

/** Orchestrates one level: builds it, runs the systems each frame and handles the outcome. */
export class GameScene extends Phaser.Scene {
  private level!: LevelDefinition;
  private levelWorld!: LevelWorld;
  private controls!: InputController;
  private background!: ParallaxBackground;
  private bus!: EventBus;
  private score!: ScoreSystem;
  private collisions!: CollisionSystem;
  private state: PlayState = 'playing';

  constructor() {
    super(SCENE_KEYS.game);
  }

  create(rawData: unknown): void {
    const data = parseGameSceneData(rawData, hasLevel, firstLevelId());
    this.level = getLevel(data.levelId);
    this.state = 'playing';
    this.physics.world.gravity.y = this.level.gravity;
    this.background = new ParallaxBackground(this, this.level.background);
    this.levelWorld = buildLevel(this, this.level);
    this.setupBounds();
    this.controls = createInput(this, { touchButtons: true });
    this.bus = EventBus.of(this);
    this.score = new ScoreSystem(this.bus, data.score);
    new ScorePopups(this, this.bus);
    this.collisions = new CollisionSystem(this, this.levelWorld, this.score, this.bus, {
      onPlayerDamaged: () => this.onPlayerDamaged(),
      onPlayerFell: () => this.onPlayerDamaged(),
      onGoalReached: () => this.onGoalReached(),
    });
    this.launchHud();
  }

  override update(time: number, delta: number): void {
    this.controls.update();
    this.background.update(this.cameras.main);
    if (this.shouldPause()) {
      this.scene.launch(SCENE_KEYS.pause);
      this.scene.pause();
      return;
    }
    this.levelWorld.player.updateFrame(time, delta, this.controls);
    this.updateEnemies(time, delta);
    if (this.state === 'playing') this.collisions.update(time);
  }

  /** Pause on request, or automatically when a phone is turned to portrait. */
  private shouldPause(): boolean {
    if (this.state !== 'playing') return false;
    const turnedToPortrait = this.sys.game.device.input.touch && this.scale.isPortrait;
    return this.controls.justPressed('pause') || turnedToPortrait;
  }

  private setupBounds(): void {
    const { map, player, enemies } = this.levelWorld;
    const width = map.widthInPixels;
    const height = map.heightInPixels;
    // No floor: falling into a gap must be possible.
    const [left, right, top, bottom] = [true, true, true, false];
    this.physics.world.setBounds(0, 0, width, height);
    this.physics.world.setBoundsCollision(left, right, top, bottom);
    player.setCollideWorldBounds(true);
    for (const enemy of enemies) enemy.setCollideWorldBounds(true);

    const camera = this.cameras.main;
    camera.setBounds(0, 0, width, height);
    camera.startFollow(player, true, CAMERA.lerp, CAMERA.lerp);
    camera.setDeadzone(CAMERA.deadzoneWidth, CAMERA.deadzoneHeight);
  }

  private launchHud(): void {
    const { health } = this.levelWorld.player;
    const data: HudSceneData = {
      levelName: this.level.name,
      score: this.score.score,
      health: health.value,
      maxHealth: health.max,
    };
    this.scene.launch(SCENE_KEYS.hud, data);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scene.stop(SCENE_KEYS.hud));
  }

  private updateEnemies(time: number, delta: number): void {
    const limit = this.levelWorld.map.heightInPixels + WORLD_LIMITS.enemyCleanupMargin;
    for (const enemy of this.levelWorld.enemies) {
      if (!enemy.active || enemy.health.isDead) continue;
      if (enemy.y > limit) enemy.destroy();
      else enemy.updateBehaviors(time, delta);
    }
  }

  private onPlayerDamaged(): void {
    const { health } = this.levelWorld.player;
    this.bus.emit('health:changed', { health: health.value, max: health.max });
    if (health.isDead && this.state === 'playing') this.loseLevel();
  }

  private loseLevel(): void {
    this.state = 'dying';
    this.levelWorld.player.die();
    this.cameras.main.stopFollow();
    this.time.delayedCall(TIMING.deathDelayMs, () => {
      const data: GameOverSceneData = {
        won: false,
        score: this.score.score,
        levelName: this.level.name,
      };
      this.scene.start(SCENE_KEYS.gameOver, data);
    });
  }

  private onGoalReached(): void {
    if (this.state !== 'playing') return;
    this.state = 'complete';
    this.levelWorld.player.freeze();
    this.score.add(SCORE.levelCompleteBonus);
    this.time.delayedCall(TIMING.levelCompleteDelayMs, () => this.advance());
  }

  private advance(): void {
    const next = this.level.nextLevel;
    if (next === null) {
      const data: GameOverSceneData = {
        won: true,
        score: this.score.score,
        levelName: this.level.name,
      };
      this.scene.start(SCENE_KEYS.gameOver, data);
      return;
    }
    const data: GameSceneData = { levelId: next, score: this.score.score };
    this.scene.restart(data);
  }
}
