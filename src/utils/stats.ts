/** How many of `pips` to fill so the best character in a stat shows a full bar. At least one. */
export function statPips(value: number, best: number, pips: number): number {
  if (!(best > 0) || !(value > 0)) return 1;
  return Math.min(pips, Math.max(1, Math.round((value / best) * pips)));
}

/** The largest integer scale at which a `width`×`height` image fits in a `box`×`box` square. */
export function integerFitScale(width: number, height: number, box: number): number {
  return Math.max(1, Math.floor(Math.min(box / width, box / height)));
}

export interface CardRowOptions {
  readonly screenWidth: number;
  readonly maxCardWidth: number;
  readonly gap: number;
  /** Space kept free at both screen edges. */
  readonly sideMargin: number;
}

export interface CardRow {
  readonly cardWidth: number;
  /** Left x of each card, in order. */
  readonly lefts: readonly number[];
}

/** Centres `count` cards in a row, shrinking them (never growing) so the row fits the screen. */
export function layoutCardRow(count: number, options: CardRowOptions): CardRow {
  if (count <= 0) return { cardWidth: 0, lefts: [] };
  const { screenWidth, maxCardWidth, gap, sideMargin } = options;
  const available = screenWidth - 2 * sideMargin - (count - 1) * gap;
  const cardWidth = Math.floor(Math.min(maxCardWidth, available / count));
  const rowWidth = count * cardWidth + (count - 1) * gap;
  const firstLeft = (screenWidth - rowWidth) / 2;
  return {
    cardWidth,
    lefts: Array.from({ length: count }, (_, i) => firstLeft + i * (cardWidth + gap)),
  };
}

/** Which page an item is on, and which items share that page. */
export function pageOf(
  index: number,
  perPage: number,
  count: number,
): { page: number; first: number; last: number } {
  const page = Math.floor(index / perPage);
  const first = page * perPage;
  return { page, first, last: Math.min(count, first + perPage) - 1 };
}

/** Next index when cycling through `count` items, wrapping at both ends. */
export function cycleIndex(index: number, step: -1 | 1, count: number): number {
  return count > 0 ? (index + step + count) % count : 0;
}
