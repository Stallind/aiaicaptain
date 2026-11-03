import type { Behavior, BehaviorHost } from './Behavior';
import { nextPatrolDirection, patrolVelocityX } from '../utils/patrol';
import type { Direction } from '../utils/patrol';

/**
 * Walks back and forth, turning at walls. With `turnAtLedges` the enemy never
 * leaves its platform: it turns before edges and doesn't drift while airborne.
 */
export class Patrol implements Behavior {
  private direction: Direction = -1;
  // Reused every frame so update() allocates nothing.
  private readonly sensors = {
    blockedLeft: false,
    blockedRight: false,
    onGround: false,
    groundAhead: true,
  };

  constructor(
    private readonly host: BehaviorHost,
    private readonly turnAtLedges: boolean,
  ) {}

  update(): void {
    const { body, sprite } = this.host;
    this.sensors.blockedLeft = body.blocked.left;
    this.sensors.blockedRight = body.blocked.right;
    this.sensors.onGround = body.blocked.down;
    // The ledge probe only means something while standing. In the air we report
    // "ground ahead" so the enemy doesn't turn mid-jump; patrolVelocityX already
    // stops sideways drift, so it lands back on the platform it left.
    this.sensors.groundAhead = !this.sensors.onGround || this.hasGroundAhead();
    this.direction = nextPatrolDirection(this.direction, this.sensors, this.turnAtLedges);
    const speed = this.host.definition.stats.speed;
    body.setVelocityX(
      patrolVelocityX(this.direction, speed, this.sensors.onGround, this.turnAtLedges),
    );
    sprite.setFlipX(this.direction < 0);
  }

  private hasGroundAhead(): boolean {
    const { body, ground } = this.host;
    const probeX = this.direction > 0 ? body.right + 1 : body.left - 1;
    const tile = ground.getTileAtWorldXY(probeX, body.bottom + 1);
    return tile !== null && tile.collides;
  }
}
