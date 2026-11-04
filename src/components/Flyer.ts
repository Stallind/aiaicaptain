import type { Behavior, BehaviorHost } from './Behavior';

const MS_PER_SECOND = 1000;

/**
 * Ignores gravity and bobs on a sine wave. Driving velocity instead of
 * position keeps it colliding with tiles like any other body.
 */
export class Flyer implements Behavior {
  private elapsed = 0;
  private readonly angularSpeed: number;

  constructor(
    private readonly host: BehaviorHost,
    private readonly amplitude: number,
    periodMs: number,
  ) {
    // ω in radians per second: one full turn (2π) per period.
    this.angularSpeed = (2 * Math.PI * MS_PER_SECOND) / periodMs;
    host.body.setAllowGravity(false);
  }

  update(_time: number, delta: number): void {
    this.elapsed += delta / MS_PER_SECOND;
    // Desired offset is y(t) = A·sin(ωt); its derivative, the velocity, is A·ω·cos(ωt).
    const velocity =
      this.amplitude * this.angularSpeed * Math.cos(this.angularSpeed * this.elapsed);
    this.host.body.setVelocityY(velocity);
  }
}
