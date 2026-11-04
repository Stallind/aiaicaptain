export interface StompInput {
  /** Bottom of the player's hitbox at the start of this physics step, before it moved. */
  readonly previousPlayerBottom: number;
  /** Top of the enemy's hitbox at the start of this physics step. */
  readonly previousEnemyTop: number;
  /** Player's vertical speed minus the enemy's; positive means closing in from above. */
  readonly relativeVelocityY: number;
  readonly tolerance: number;
}

/**
 * A contact counts as a stomp when the player came from above: before this
 * physics step their feet were at (or just below) the enemy's top, and they
 * weren't moving away from it.
 *
 * Positions are taken from *before* the step on purpose. A fast fall moves the
 * player ~9 px per step, so by the time the overlap is reported the feet can
 * already be deep inside a short enemy. Velocity is relative because the ground
 * collision may already have stopped the player, and a jumping enemy can rise
 * into a player who is standing still above it.
 */
export function isStomp(input: StompInput): boolean {
  return (
    input.relativeVelocityY >= 0 &&
    input.previousPlayerBottom <= input.previousEnemyTop + input.tolerance
  );
}

/** Direction (-1 or 1) that pushes the player away from what hit them. */
export function knockbackDirection(playerX: number, sourceX: number): -1 | 1 {
  return playerX < sourceX ? -1 : 1;
}
