/**
 * Render interpolation for a fixed physics step ("fix your timestep").
 *
 * Physics moves things 60 times a second. A faster screen would show each
 * position for several frames, which looks blurry at speed. Instead each frame
 * draws objects between their last two physics positions, `alpha` of the way.
 */

/** How far (0..1) the time not yet simulated reaches into the next physics step. */
export function stepAlpha(unsimulatedMs: number, stepMs: number): number {
  if (!(stepMs > 0) || !Number.isFinite(unsimulatedMs)) return 1;
  return Math.min(1, Math.max(0, unsimulatedMs / stepMs));
}

/** The last two physics positions of one object. */
export class PositionHistory {
  private previousX: number;
  private previousY: number;

  constructor(
    private currentX: number,
    private currentY: number,
  ) {
    this.previousX = currentX;
    this.previousY = currentY;
  }

  get x(): number {
    return this.currentX;
  }

  get y(): number {
    return this.currentY;
  }

  /** Call after each frame in which physics stepped. */
  record(x: number, y: number): void {
    this.previousX = this.currentX;
    this.previousY = this.currentY;
    this.currentX = x;
    this.currentY = y;
  }

  /** A jump (a teleport, a respawn): draw it where it is, with nothing to smooth from. */
  jumpTo(x: number, y: number): void {
    this.previousX = x;
    this.previousY = y;
    this.currentX = x;
    this.currentY = y;
  }

  /** The position to draw, `alpha` of the way from the previous to the current physics position. */
  interpolatedX(alpha: number): number {
    return this.previousX + (this.currentX - this.previousX) * alpha;
  }

  interpolatedY(alpha: number): number {
    return this.previousY + (this.currentY - this.previousY) * alpha;
  }
}
