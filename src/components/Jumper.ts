import type { Behavior, BehaviorHost } from './Behavior';

/** Jumps at a fixed interval whenever it is standing on something. */
export class Jumper implements Behavior {
  private sinceJump = 0;

  constructor(
    private readonly host: BehaviorHost,
    private readonly intervalMs: number,
  ) {}

  update(_time: number, delta: number): void {
    this.sinceJump += delta;
    const { body, definition } = this.host;
    if (body.blocked.down && this.sinceJump >= this.intervalMs) {
      body.setVelocityY(-definition.stats.jumpVelocity);
      this.sinceJump = 0;
    }
  }
}
