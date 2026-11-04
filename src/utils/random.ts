export type Rng = () => number;

const UINT32_RANGE = 2 ** 32;

/**
 * Small deterministic PRNG so generated backgrounds look the same every run.
 *
 * This is mulberry32 by Tommy Ettinger (public domain), copied verbatim. The
 * hex constant and shift amounts are the algorithm's tuned parameters: changing
 * any of them silently degrades the randomness, so don't "tidy" them.
 * `>>> 0` forces unsigned 32-bit arithmetic; Math.imul is 32-bit multiplication.
 */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / UINT32_RANGE;
  };
}

export interface Star {
  readonly x: number;
  readonly y: number;
  /** 0..1, used for alpha. */
  readonly brightness: number;
  readonly size: 1 | 2;
}

export function generateStars(count: number, width: number, height: number, rng: Rng): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.floor(rng() * width),
      y: Math.floor(rng() * height),
      brightness: 0.3 + rng() * 0.7,
      size: rng() > 0.9 ? 2 : 1,
    });
  }
  return stars;
}
