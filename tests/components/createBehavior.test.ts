import { describe, expect, it } from 'vitest';
import type { BehaviorHost } from '../../src/components/Behavior';
import { createBehavior } from '../../src/components/createBehavior';
import { Flyer } from '../../src/components/Flyer';
import { Jumper } from '../../src/components/Jumper';
import { Patrol } from '../../src/components/Patrol';

// Constructors only touch body.setAllowGravity; the rest of the host is unused here.
let gravityDisabled = false;
const host = {
  body: {
    setAllowGravity: (allow: boolean) => {
      gravityDisabled = !allow;
    },
  },
} as unknown as BehaviorHost;

describe('createBehavior', () => {
  it('maps every component spec to its behaviour', () => {
    expect(createBehavior({ type: 'patrol', turnAtLedges: true }, host)).toBeInstanceOf(Patrol);
    expect(createBehavior({ type: 'jumper', intervalMs: 100 }, host)).toBeInstanceOf(Jumper);
    expect(createBehavior({ type: 'flyer', amplitude: 4, periodMs: 1000 }, host)).toBeInstanceOf(
      Flyer,
    );
  });

  it('turns gravity off for flyers', () => {
    gravityDisabled = false;
    createBehavior({ type: 'flyer', amplitude: 4, periodMs: 1000 }, host);
    expect(gravityDisabled).toBe(true);
  });
});
