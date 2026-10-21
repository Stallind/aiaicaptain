import { describe, expect, it } from 'vitest';
import { ComboCounter } from '../../src/components/ComboCounter';
import { EventBus } from '../../src/events/EventBus';
import type { Emitter, GameEvents } from '../../src/events/EventBus';
import { ScoreSystem } from '../../src/systems/ScoreSystem';

/** Minimal synchronous emitter standing in for Phaser's. */
function createFakeEmitter(): Emitter {
  const listeners = new Map<string, ((...args: never[]) => void)[]>();
  return {
    emit: (event, ...args) => {
      for (const fn of listeners.get(event) ?? []) (fn as (...a: unknown[]) => void)(...args);
    },
    on: (event, fn) => listeners.set(event, [...(listeners.get(event) ?? []), fn]),
    off: (event, fn) =>
      listeners.set(
        event,
        (listeners.get(event) ?? []).filter((l) => l !== fn),
      ),
  };
}

describe('EventBus', () => {
  it('delivers typed payloads and stops after off()', () => {
    const bus = new EventBus(createFakeEmitter());
    const received: number[] = [];
    const listener = (p: GameEvents['score:changed']) => received.push(p.score);
    bus.on('score:changed', listener);
    bus.emit('score:changed', { score: 5 });
    bus.off('score:changed', listener);
    bus.emit('score:changed', { score: 9 });
    expect(received).toEqual([5]);
  });
});

describe('ScoreSystem', () => {
  it('adds points and announces the new total', () => {
    const bus = new EventBus(createFakeEmitter());
    const announced: number[] = [];
    bus.on('score:changed', (p) => announced.push(p.score));
    const score = new ScoreSystem(bus, 100);
    score.add(50);
    score.add(0);
    score.add(-10);
    expect(score.score).toBe(150);
    expect(announced).toEqual([150]);
  });
});

describe('ComboCounter', () => {
  it('multiplies chained stomps and resets on landing', () => {
    const combo = new ComboCounter(3);
    expect(combo.stomp(100)).toBe(100);
    expect(combo.stomp(100)).toBe(200);
    expect(combo.stomp(100)).toBe(300);
    expect(combo.stomp(100)).toBe(300);
    combo.reset();
    expect(combo.length).toBe(0);
    expect(combo.stomp(100)).toBe(100);
  });
});
