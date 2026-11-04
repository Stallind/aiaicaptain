// Reduces downsampled pixels to K colours (k-means) and prints a char matrix + palette.
// Usage: node quantize.mjs pixels.txt K [bgThreshold]
import { readFileSync, writeFileSync } from 'node:fs';

const [, , file, kArg] = process.argv;
const K = Number(kArg ?? 8);
const rows = readFileSync(file, 'utf8')
  .trim()
  .split(/\r?\n/)
  .map((l) =>
    l
      .trim()
      .split(' ')
      .map((p) => p.split(',').map(Number)),
  );
const pixels = rows.flat();

let centres = Array.from({ length: K }, (_, i) =>
  pixels[Math.floor(((i + 0.5) * pixels.length) / K)].slice(),
);
const dist = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
const nearest = (p) =>
  centres.reduce((best, c, i) => (dist(p, c) < dist(p, centres[best]) ? i : best), 0);
for (let iter = 0; iter < 40; iter++) {
  const sums = centres.map(() => [0, 0, 0, 0]);
  for (const p of pixels) {
    const s = sums[nearest(p)];
    s[0] += p[0];
    s[1] += p[1];
    s[2] += p[2];
    s[3]++;
  }
  centres = sums.map((s, i) => (s[3] ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] : centres[i]));
}
// Sort dark → light so chars read naturally.
const order = centres
  .map((c, i) => [i, c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11])
  .sort((a, b) => a[1] - b[1])
  .map(([i]) => i);
const chars = 'abcdefghij';
const charOf = new Map(order.map((ci, rank) => [ci, chars[rank]]));
const hex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const matrix = rows.map((r) => r.map((p) => charOf.get(nearest(p))).join(''));
console.log(order.map((ci, rank) => `${chars[rank]} ${hex(centres[ci])}`).join('\n'));
console.log(matrix.map((r) => `'${r}',`).join('\n'));
writeFileSync(
  file + '.json',
  JSON.stringify({
    palette: Object.fromEntries(order.map((ci, rank) => [chars[rank], hex(centres[ci])])),
    matrix,
  }),
);
