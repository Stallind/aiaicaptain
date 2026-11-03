import { describe, expect, it } from 'vitest';
import { nextPatrolDirection, patrolVelocityX } from '../../src/utils/patrol';

const open = { blockedLeft: false, blockedRight: false, onGround: true, groundAhead: true };

describe('nextPatrolDirection', () => {
  it('keeps walking on open ground', () => {
    expect(nextPatrolDirection(1, open, true)).toBe(1);
  });

  it('turns at walls', () => {
    expect(nextPatrolDirection(-1, { ...open, blockedLeft: true }, false)).toBe(1);
    expect(nextPatrolDirection(1, { ...open, blockedRight: true }, false)).toBe(-1);
  });

  it('turns before a ledge only when staying on the platform', () => {
    const ledge = { ...open, groundAhead: false };
    expect(nextPatrolDirection(1, ledge, true)).toBe(-1);
    expect(nextPatrolDirection(-1, ledge, true)).toBe(1);
    expect(nextPatrolDirection(1, ledge, false)).toBe(1);
  });

  it('ignores the ledge probe while airborne', () => {
    expect(nextPatrolDirection(1, { ...open, onGround: false, groundAhead: false }, true)).toBe(1);
  });
});

describe('patrolVelocityX', () => {
  it('moves at speed in the patrol direction on the ground', () => {
    expect(patrolVelocityX(-1, 40, true, true)).toBe(-40);
  });

  it('stops drifting sideways in the air when it must stay on its platform', () => {
    expect(patrolVelocityX(1, 40, false, true)).toBe(0);
  });

  it('keeps moving in the air for enemies allowed to leave (e.g. flyers)', () => {
    expect(patrolVelocityX(1, 25, false, false)).toBe(25);
  });
});
