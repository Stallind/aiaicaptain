// Applies hand fixes to the cleaned 32x32 face and prints it as TS array rows.
import { readFileSync, writeFileSync } from 'node:fs';

const [, , file, out] = process.argv;
const sprite = JSON.parse(readFileSync(file, 'utf8'));
const m = sprite.matrix.map((r) => [...r]);
const set = (y, x, s) => [...s].forEach((c, i) => (m[y][x + i] = c));
set(20, 7, 'k'); // close the outline gap under the left ear cup
set(30, 12, 't'); // stray dark pixel in the shirt
set(31, 12, 'uuuuuuuu'); // white T-shirt collar, erased by the fringe cleanup
sprite.matrix = m.map((r) => r.join(''));
writeFileSync(out, JSON.stringify(sprite));
console.log(sprite.matrix.map((r) => `    '${r}',`).join('\n'));
