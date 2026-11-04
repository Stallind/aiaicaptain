import { describe, expect, it } from 'vitest';
import { PositionHistory, stepAlpha } from '../../src/utils/interpolation';

describe('stepAlpha', () => {
  it('is the share of a physics step that has passed', () => {
    expect(stepAlpha(0, 16)).toBe(0);
    expect(stepAlpha(8, 16)).toBe(0.5);
  });

  it('stays within 0..1', () => {
    expect(stepAlpha(40, 16)).toBe(1);
    expect(stepAlpha(-3, 16)).toBe(0);
  });

  it('falls back to the physics position when the timing is unknown', () => {
    expect(stepAlpha(Number.NaN, 16)).toBe(1);
    expect(stepAlpha(8, 0)).toBe(1);
  });
});

describe('PositionHistory', () => {
  it('starts at rest, so the first frame draws the spawn position', () => {
    const history = new PositionHistory(10, 20);
    expect(history.interpolatedX(0.5)).toBe(10);
    expect(history.interpolatedY(0.5)).toBe(20);
  });

  it('draws between the last two physics positions', () => {
    const history = new PositionHistory(0, 0);
    history.record(4, -2);
    expect(history.interpolatedX(0.25)).toBe(1);
    expect(history.interpolatedY(0.5)).toBe(-1);
    history.record(8, -4);
    expect(history.interpolatedX(0)).toBe(4);
    expect(history.x).toBe(8);
    expect(history.y).toBe(-4);
  });
});

describe('PositionHistory jumps', () => {
  it('draws a teleport where it landed instead of sliding there', () => {
    const history = new PositionHistory(0, 0);
    history.record(4, 0);
    history.jumpTo(500, 80);
    expect(history.interpolatedX(0.5)).toBe(500);
    expect(history.interpolatedY(0.5)).toBe(80);
    history.record(504, 80);
    expect(history.interpolatedX(0.5)).toBe(502);
  });
});
