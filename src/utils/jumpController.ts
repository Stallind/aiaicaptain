export type JumpDecision = 'none' | 'jump' | 'shortenJump';

export interface JumpTiming {
  readonly coyoteMs: number;
  readonly jumpBufferMs: number;
}

/**
 * Decides when to jump. Kept free of Phaser so the platformer "feel" can be
 * unit-tested.
 *
 * State machine:
 * - Two timers count how long ago the player stood on ground and pressed jump.
 *   A jump starts when both are inside their windows (coyote time / buffering).
 *   `Infinity` means "not recently", and is also used to consume a window.
 * - While `jumpInProgress`, releasing the button returns 'shortenJump' once,
 *   which gives variable jump height. Landing or `reset()` ends the jump.
 */
export class JumpController {
  private msSinceGrounded = Number.POSITIVE_INFINITY;
  private msSincePressed = Number.POSITIVE_INFINITY;
  private jumpInProgress = false;

  constructor(private readonly timing: JumpTiming) {}

  update(deltaMs: number, onGround: boolean, pressed: boolean, held: boolean): JumpDecision {
    this.msSinceGrounded = onGround ? 0 : this.msSinceGrounded + deltaMs;
    this.msSincePressed = pressed ? 0 : this.msSincePressed + deltaMs;

    const canJump = this.msSinceGrounded <= this.timing.coyoteMs;
    const wantsJump = this.msSincePressed <= this.timing.jumpBufferMs;
    if (canJump && wantsJump && !this.jumpInProgress) {
      this.jumpInProgress = true;
      // Consume both windows so one press gives exactly one jump.
      this.msSinceGrounded = Number.POSITIVE_INFINITY;
      this.msSincePressed = Number.POSITIVE_INFINITY;
      return 'jump';
    }
    if (this.jumpInProgress && !held) {
      this.jumpInProgress = false;
      return 'shortenJump';
    }
    if (onGround) {
      this.jumpInProgress = false;
    }
    return 'none';
  }

  /** Called when the jump ends for another reason, such as hitting the ceiling or a stomp bounce. */
  reset(): void {
    this.jumpInProgress = false;
  }
}
