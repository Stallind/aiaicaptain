import { describe, expect, it } from 'vitest';
import { renderGlyphGrid } from '../../src/graphics/binaryGlyphs';

describe('renderGlyphGrid', () => {
  it('draws each digit as a 3x5 glyph with a 1px gap right and below', () => {
    const frame = renderGlyphGrid({ digits: ['10'], colours: ['ab'] });
    expect(frame).toEqual(['.a..bbb.', 'aa..b.b.', '.a..b.b.', '.a..b.b.', 'aaa.bbb.', '........']);
  });

  it('leaves empty cells blank and keeps rows equally long', () => {
    const frame = renderGlyphGrid({ digits: ['.1', '0.'], colours: ['.x', 'y.'] });
    expect(frame).toHaveLength(12);
    expect(new Set(frame.map((row) => row.length))).toEqual(new Set([8]));
    expect(frame[0]).toBe('.....x..');
    expect(frame[6]).toBe('yyy.....');
  });
});

describe('renderGlyphGrid validation', () => {
  it('rejects grids that would produce a broken sprite', () => {
    expect(() => renderGlyphGrid({ digits: [], colours: [] })).toThrow(/empty/);
    expect(() => renderGlyphGrid({ digits: ['10'], colours: ['a'] })).toThrow(/row 0/);
    expect(() => renderGlyphGrid({ digits: ['10', '1'], colours: ['ab', 'a'] })).toThrow(/row 1/);
    expect(() => renderGlyphGrid({ digits: ['12'], colours: ['ab'] })).toThrow(/"2" is not 0, 1/);
    expect(() => renderGlyphGrid({ digits: ['10'], colours: [] })).toThrow(/colour rows/);
  });
});
