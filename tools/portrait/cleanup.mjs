// Removes light background fringe on the silhouette edge and adds a dark outline.
import { readFileSync, writeFileSync } from 'node:fs';

const [, , file, out, passesArg] = process.argv;
const sprite = JSON.parse(readFileSync(file, 'utf8'));
let g = sprite.matrix.map((r) => [...r]);
const H = g.length;
const W = g[0].length;
const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? '.' : g[y][x]);
const touchesEmpty = (x, y) =>
  [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ].some(([dx, dy]) => at(x + dx, y + dy) === '.');
const FRINGE = new Set(['W', 'L', 'S', 'u', 'o']);

for (let pass = 0; pass < Number(passesArg ?? 2); pass++) {
  g = g.map((row, y) => row.map((c, x) => (FRINGE.has(c) && touchesEmpty(x, y) ? '.' : c)));
}
// Outline: empty pixels next to the silhouette become dark, except below the shirt (cropped edge).
g = g.map((row, y) =>
  row.map((c, x) => (c === '.' && y < H - 1 && !touchesEmptyAll(x, y) ? 'k' : c)),
);
function touchesEmptyAll(x, y) {
  return [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ].every(([dx, dy]) => at(x + dx, y + dy) === '.');
}
sprite.matrix = g.map((r) => r.join(''));
console.log(sprite.matrix.map((r) => `'${r}',`).join('\n'));
writeFileSync(out, JSON.stringify(sprite));
