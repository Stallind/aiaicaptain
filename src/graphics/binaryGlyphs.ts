import type { SpriteFrame } from '../content/types';

/** 3×5 pixel digits; '#' is ink. */
const GLYPHS: Readonly<Record<'0' | '1', readonly string[]>> = {
  '0': ['###', '#.#', '#.#', '#.#', '###'],
  '1': ['.#.', '##.', '.#.', '.#.', '###'],
};

const GLYPH_WIDTH = 3;
const GLYPH_HEIGHT = 5;
/** Empty pixels between neighbouring digits. */
const GAP = 1;

export interface GlyphGrid {
  /** One string per row of digits: '0', '1', or '.' for an empty cell. */
  readonly digits: readonly string[];
  /** Same shape as `digits`: the palette key each digit is drawn in. */
  readonly colours: readonly string[];
}

/**
 * Draws a figure made only of tiny 0 and 1 digits, as a normal sprite frame.
 * Each cell becomes a 3×5 digit plus a 1-pixel gap to the right and below.
 */
export function renderGlyphGrid(grid: GlyphGrid, empty = '.'): SpriteFrame {
  assertValidGrid(grid, empty);
  const cellWidth = GLYPH_WIDTH + GAP;
  const cellHeight = GLYPH_HEIGHT + GAP;
  const columns = grid.digits[0]?.length ?? 0;
  const rows: string[][] = Array.from({ length: grid.digits.length * cellHeight }, () =>
    Array.from({ length: columns * cellWidth }, () => empty),
  );
  grid.digits.forEach((digitRow, cy) => {
    [...digitRow].forEach((digit, cx) => {
      if (digit !== '0' && digit !== '1') return;
      const colour = grid.colours[cy]?.charAt(cx) ?? empty;
      GLYPHS[digit].forEach((glyphRow, gy) => {
        [...glyphRow].forEach((pixel, gx) => {
          const row = rows[cy * cellHeight + gy];
          if (pixel === '#' && row) row[cx * cellWidth + gx] = colour;
        });
      });
    });
  });
  return rows.map((row) => row.join(''));
}

/** A ragged grid would silently produce rows of different lengths, which breaks the sprite. */
function assertValidGrid(grid: GlyphGrid, empty: string): void {
  const columns = grid.digits[0]?.length ?? 0;
  if (grid.digits.length === 0 || columns === 0) throw new Error('Glyph grid is empty');
  if (grid.colours.length !== grid.digits.length) {
    throw new Error(
      `Glyph grid has ${grid.digits.length} digit rows but ${grid.colours.length} colour rows`,
    );
  }
  grid.digits.forEach((digits, y) => {
    const colours = grid.colours[y] ?? '';
    if (digits.length !== columns || colours.length !== columns) {
      throw new Error(`Glyph grid row ${y}: digits and colours must both be ${columns} wide`);
    }
    [...digits].forEach((digit, x) => {
      if (digit !== '0' && digit !== '1' && digit !== empty) {
        throw new Error(`Glyph grid row ${y}, column ${x}: "${digit}" is not 0, 1 or "${empty}"`);
      }
    });
  });
}
