/** Chained stomps without landing give 1x, 2x, 3x ... up to the cap. */
export function comboMultiplier(chain: number, cap: number): number {
  return Math.max(1, Math.min(chain, cap));
}

export function stompPoints(baseValue: number, chain: number, cap: number): number {
  return baseValue * comboMultiplier(chain, cap);
}

export function isNewHighscore(score: number, highscore: number): boolean {
  return score > highscore;
}
