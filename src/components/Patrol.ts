import type { Behavior, BehaviorHost } from './Behavior';

/** Walks back and forth, turning at walls and optionally before ledges. */
export class Patrol implements Behavior {
  private direction: -1 | 1 = -1;

  constructor(
    private readonly host: BehaviorHost,
    private readonly turnAtLedges: boolean,
  ) {}

  update(): void {
    const { body, sprite } = this.host;
    if (body.blocked.left) this.direction = 1;
    else if (body.blocked.right) this.direction = -1;
    else if (this.turnAtLedges && body.blocked.down && !this.hasGroundAhead()) {
      this.direction = this.direction === 1 ? -1 : 1;
    }
    body.setVelocityX(this.direction * this.host.definition.stats.speed);
    sprite.setFlipX(this.direction < 0);
  }

  private hasGroundAhead(): boolean {
    const { body, ground } = this.host;
    const probeX = this.direction > 0 ? body.right + 1 : body.left - 1;
    const tile = ground.getTileAtWorldXY(probeX, body.bottom + 1);
    return tile !== null && tile.collides;
  }
}
