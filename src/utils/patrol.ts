export type Direction = -1 | 1;

export interface PatrolSensors {
  readonly blockedLeft: boolean;
  readonly blockedRight: boolean;
  readonly onGround: boolean;
  /** Whether there is solid ground just beyond the leading edge. Only meaningful on the ground. */
  readonly groundAhead: boolean;
}

/** Turn around at walls, and before ledges when staying on the platform. */
export function nextPatrolDirection(
  direction: Direction,
  sensors: PatrolSensors,
  stayOnPlatform: boolean,
): Direction {
  if (sensors.blockedLeft) return 1;
  if (sensors.blockedRight) return -1;
  if (stayOnPlatform && sensors.onGround && !sensors.groundAhead) return direction === 1 ? -1 : 1;
  return direction;
}

/**
 * Horizontal speed for this frame. Ledge checks only work on the ground, so an
 * enemy that must stay on its platform doesn't drift sideways while airborne:
 * a jump then lands where it started instead of carrying it over a gap.
 */
export function patrolVelocityX(
  direction: Direction,
  speed: number,
  onGround: boolean,
  stayOnPlatform: boolean,
): number {
  return stayOnPlatform && !onGround ? 0 : direction * speed;
}
