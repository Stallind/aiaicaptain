import Phaser from 'phaser';
import { DEPTH, PLAYER_TUNING, TIMING } from '../config/constants';
import type { PlayerDefinition } from '../content/types';
import { Health } from '../components/Health';
import { COLORS } from '../graphics/palette';
import type { InputController } from '../input/InputController';
import { knockbackDirection } from '../utils/combat';
import { JumpController } from '../utils/jumpController';
import { findAnimation, setupPhysicsSprite } from './physicsSprite';

interface PlayerAnimations {
  readonly idle: string | null;
  readonly run: string | null;
  readonly jump: string | null;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  readonly health: Health;
  private readonly jump = new JumpController(PLAYER_TUNING);
  private readonly physicsBody: Phaser.Physics.Arcade.Body;
  // Resolved once so the per-frame animation update allocates nothing.
  private readonly animations: PlayerAnimations;
  private controlLockedUntil = 0;
  private controllable = true;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    readonly definition: PlayerDefinition,
  ) {
    super(scene, x, y, definition.id, 0);
    this.physicsBody = setupPhysicsSprite(this, definition, DEPTH.player);
    this.physicsBody.setMaxVelocityY(PLAYER_TUNING.maxFallSpeed);
    this.health = new Health(definition.stats.health, PLAYER_TUNING.invulnerableMs);
    this.animations = {
      idle: findAnimation(scene, definition.id, 'idle'),
      run: findAnimation(scene, definition.id, 'run'),
      jump: findAnimation(scene, definition.id, 'jump'),
    };
  }

  get feetY(): number {
    return this.physicsBody.bottom;
  }

  get velocityY(): number {
    return this.physicsBody.velocity.y;
  }

  get onGround(): boolean {
    return this.physicsBody.blocked.down;
  }

  /** Per-frame update: apply input, then update how the player looks. */
  updateFrame(time: number, delta: number, input: InputController): void {
    if (!this.controllable) return;
    this.applyControls(time, delta, input);
    this.updateAppearance(time);
  }

  /** Bounce after landing on an enemy. */
  bounce(): void {
    this.jump.reset();
    this.physicsBody.setVelocityY(
      -this.definition.stats.jumpVelocity * PLAYER_TUNING.stompBounceFactor,
    );
  }

  /** Applies one point of damage plus knockback. Returns false while invulnerable. */
  hurt(sourceX: number, time: number): boolean {
    if (!this.health.damage(1, time)) return false;
    this.knockBack(sourceX, time);
    return true;
  }

  /** Death animation: hop up and fall through the floor. */
  die(): void {
    this.controllable = false;
    this.setVisible(true).setTint(Phaser.Display.Color.HexStringToColor(COLORS.red).color);
    this.anims.stop();
    this.physicsBody.checkCollision.none = true;
    this.physicsBody.setCollideWorldBounds(false);
    this.physicsBody.setVelocity(
      0,
      -this.definition.stats.jumpVelocity * PLAYER_TUNING.deathHopFactor,
    );
  }

  /** Stops the player in place, e.g. on reaching the goal. */
  freeze(): void {
    this.controllable = false;
    this.physicsBody.setVelocity(0, 0);
    this.physicsBody.setAllowGravity(false);
    this.anims.stop();
    this.setVisible(true);
  }

  private knockBack(sourceX: number, time: number): void {
    const direction = knockbackDirection(this.x, sourceX);
    this.physicsBody.setVelocity(direction * PLAYER_TUNING.knockbackX, -PLAYER_TUNING.knockbackY);
    this.controlLockedUntil = time + PLAYER_TUNING.knockbackLockMs;
  }

  private applyControls(time: number, delta: number, input: InputController): void {
    if (time >= this.controlLockedUntil) this.move(input);
    this.handleJump(delta, input);
  }

  private updateAppearance(time: number): void {
    this.updateBlink(time);
    this.updateAnimation();
  }

  private move(input: InputController): void {
    const direction = (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0);
    this.physicsBody.setVelocityX(direction * this.definition.stats.speed);
    if (direction !== 0) this.setFlipX(direction < 0);
  }

  private handleJump(delta: number, input: InputController): void {
    const decision = this.jump.update(
      delta,
      this.onGround,
      input.justPressed('jump'),
      input.isDown('jump'),
    );
    if (decision === 'jump') {
      this.physicsBody.setVelocityY(-this.definition.stats.jumpVelocity);
    } else if (decision === 'shortenJump' && this.physicsBody.velocity.y < 0) {
      this.physicsBody.setVelocityY(this.physicsBody.velocity.y * PLAYER_TUNING.jumpCutFactor);
    }
    if (this.physicsBody.blocked.up) this.jump.reset();
  }

  private updateBlink(time: number): void {
    const invulnerable = this.health.isInvulnerable(time);
    this.setVisible(!invulnerable || Math.floor(time / TIMING.blinkIntervalMs) % 2 === 0);
  }

  private updateAnimation(): void {
    let key: string | null;
    if (!this.onGround) key = this.animations.jump;
    else if (this.physicsBody.velocity.x !== 0) key = this.animations.run;
    else key = this.animations.idle;
    if (key) this.play(key, true);
  }
}
