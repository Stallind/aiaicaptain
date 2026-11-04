import { describe, expect, it } from 'vitest';
import {
  cycleIndex,
  integerFitScale,
  layoutCardRow,
  pageOf,
  statPips,
} from '../../src/utils/stats';

describe('statPips', () => {
  it('gives the best character a full bar and others a share of it', () => {
    expect(statPips(165, 165, 5)).toBe(5);
    expect(statPips(140, 165, 5)).toBe(4);
  });

  it('always shows at least one pip and never more than the bar', () => {
    expect(statPips(1, 1000, 5)).toBe(1);
    expect(statPips(0, 0, 5)).toBe(1);
    expect(statPips(500, 100, 5)).toBe(5);
  });
});

describe('integerFitScale', () => {
  it('picks the largest whole-number scale that fits the box', () => {
    expect(integerFitScale(32, 32, 108)).toBe(3);
    expect(integerFitScale(32, 36, 108)).toBe(3);
    expect(integerFitScale(40, 40, 108)).toBe(2);
    expect(integerFitScale(200, 200, 108)).toBe(1);
  });
});

describe('cycleIndex', () => {
  it('wraps at both ends', () => {
    expect(cycleIndex(0, -1, 2)).toBe(1);
    expect(cycleIndex(1, 1, 2)).toBe(0);
    expect(cycleIndex(0, 1, 3)).toBe(1);
  });
});

describe('layoutCardRow', () => {
  const options = { screenWidth: 640, maxCardWidth: 200, gap: 24, sideMargin: 16 };

  it('keeps full-width cards when they fit, centred', () => {
    const row = layoutCardRow(2, options);
    expect(row.cardWidth).toBe(200);
    expect(row.lefts).toEqual([108, 332]);
  });

  it('shrinks cards so three still fit on screen', () => {
    const row = layoutCardRow(3, options);
    expect(row.cardWidth).toBe(186);
    const last = row.lefts[2] ?? 0;
    expect(row.lefts[0]).toBeGreaterThanOrEqual(16);
    expect(last + row.cardWidth).toBeLessThanOrEqual(640 - 16);
  });

  it('handles an empty list', () => {
    expect(layoutCardRow(0, options)).toEqual({ cardWidth: 0, lefts: [] });
  });
});

describe('pageOf', () => {
  it('groups items into pages', () => {
    expect(pageOf(0, 3, 5)).toEqual({ page: 0, first: 0, last: 2 });
    expect(pageOf(4, 3, 5)).toEqual({ page: 1, first: 3, last: 4 });
  });
});
