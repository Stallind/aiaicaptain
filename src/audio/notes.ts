const SEMITONES: Readonly<Record<string, number>> = {
  C: -9,
  D: -7,
  E: -5,
  F: -4,
  G: -2,
  A: 0,
  B: 2,
};
const NOTE_PATTERN = /^([A-G])(#|b)?([0-8])$/;
const A4_HZ = 440;

/** Frequency of a note name such as "A4" (440 Hz), "C#5" or "Bb3"; null if it isn't one. */
export function noteFrequency(name: string): number | null {
  const match = NOTE_PATTERN.exec(name);
  if (!match) return null;
  const [, letter = '', accidental, octave = ''] = match;
  const base = SEMITONES[letter];
  if (base === undefined) return null;
  const shift = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0;
  const semitonesFromA4 = base + shift + (Number(octave) - 4) * 12;
  return A4_HZ * 2 ** (semitonesFromA4 / 12);
}

export type DrumHit = 'kick' | 'snare' | 'hat';
const DRUM_TOKENS: Readonly<Record<string, DrumHit>> = { k: 'kick', s: 'snare', h: 'hat' };

export function drumHit(token: string): DrumHit | null {
  return DRUM_TOKENS[token] ?? null;
}

export const HOLD = '.';
export const REST = '-';

export function splitSteps(steps: string): string[] {
  return steps.split(/\s+/).filter((token) => token.length > 0);
}
