import { stompPoints } from '../utils/score';

/** Counts stomps chained without touching the ground; each one in a chain is worth more. */
export class ComboCounter {
  private chain = 0;

  constructor(private readonly maxMultiplier: number) {}

  get length(): number {
    return this.chain;
  }

  /** Registers a stomp and returns the points it is worth. */
  stomp(baseValue: number): number {
    this.chain += 1;
    return stompPoints(baseValue, this.chain, this.maxMultiplier);
  }

  /** Call when the player lands. */
  reset(): void {
    this.chain = 0;
  }
}
