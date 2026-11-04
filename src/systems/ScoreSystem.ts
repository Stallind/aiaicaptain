import type { EventBus } from '../events/EventBus';

export class ScoreSystem {
  constructor(
    private readonly bus: EventBus,
    private current: number,
  ) {}

  get score(): number {
    return this.current;
  }

  add(points: number): void {
    if (points <= 0) return;
    this.current += points;
    this.bus.emit('score:changed', { score: this.current });
  }
}
