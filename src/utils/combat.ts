export interface StompInput {
  readonly playerBottom: number;
  readonly playerVelocityY: number;
  readonly enemyTop: number;
  readonly tolerance: number;
}

/** A hit counts as a stomp when the player is falling and their feet are near the enemy's top. */
export function isStomp(input: StompInput): boolean {
  return input.playerVelocityY > 0 && input.playerBottom <= input.enemyTop + input.tolerance;
}

/** Direction (-1 or 1) that pushes the player away from what hit them. */
export function knockbackDirection(playerX: number, sourceX: number): -1 | 1 {
  return playerX < sourceX ? -1 : 1;
}
