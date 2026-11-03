export type Anchor = 'bottom-left' | 'bottom-right' | 'top-right';

export interface TouchLayoutInput {
  readonly anchor: Anchor;
  readonly slot: number;
  readonly radius: number;
  /** Radius of a full-size button; slots are spaced by this so mixed sizes still line up. */
  readonly slotRadius: number;
  readonly margin: number;
  readonly screenWidth: number;
  readonly screenHeight: number;
}

/**
 * Centre of an on-screen button. Buttons sit `margin` from the screen edge;
 * each further slot moves one full button width plus a margin away from the corner.
 */
export function touchButtonCentre(input: TouchLayoutInput): { x: number; y: number } {
  const { anchor, slot, radius, slotRadius, margin, screenWidth, screenHeight } = input;
  const offset = slot * (slotRadius * 2 + margin);
  const fromLeft = margin + radius + offset;
  const fromRight = screenWidth - margin - radius - offset;
  switch (anchor) {
    case 'bottom-left':
      return { x: fromLeft, y: screenHeight - margin - radius };
    case 'bottom-right':
      return { x: fromRight, y: screenHeight - margin - radius };
    case 'top-right':
      return { x: fromRight, y: margin + radius };
  }
}
