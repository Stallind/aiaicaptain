import type { ComponentSpec } from '../content/types';
import type { Behavior, BehaviorHost } from './Behavior';
import { Flyer } from './Flyer';
import { Jumper } from './Jumper';
import { Patrol } from './Patrol';

/** Maps data-only component specs to live behaviours. Add new component types here. */
export function createBehavior(spec: ComponentSpec, host: BehaviorHost): Behavior {
  switch (spec.type) {
    case 'patrol':
      return new Patrol(host, spec.turnAtLedges);
    case 'jumper':
      return new Jumper(host, spec.intervalMs);
    case 'flyer':
      return new Flyer(host, spec.amplitude, spec.periodMs);
  }
}
