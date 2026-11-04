import { describe, expect, it } from 'vitest';
import { touchButtonCentre } from '../../src/utils/touchLayout';

const screen = { slotRadius: 34, margin: 18, screenWidth: 640, screenHeight: 360 };

describe('touchButtonCentre', () => {
  it('places bottom-left buttons from the corner inwards', () => {
    expect(touchButtonCentre({ ...screen, anchor: 'bottom-left', slot: 0, radius: 34 })).toEqual({
      x: 52,
      y: 308,
    });
    expect(touchButtonCentre({ ...screen, anchor: 'bottom-left', slot: 1, radius: 34 })).toEqual({
      x: 138,
      y: 308,
    });
  });

  it('places right-anchored buttons from the right edge', () => {
    expect(touchButtonCentre({ ...screen, anchor: 'bottom-right', slot: 0, radius: 34 })).toEqual({
      x: 588,
      y: 308,
    });
    expect(touchButtonCentre({ ...screen, anchor: 'top-right', slot: 0, radius: 17 })).toEqual({
      x: 605,
      y: 35,
    });
  });
});
