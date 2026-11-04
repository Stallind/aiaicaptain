// Maps quantized clusters (a=darkest .. i=lightest) to a stylised palette by region.
// Background = light clusters connected to the border → transparent.
import { readFileSync, writeFileSync } from 'node:fs';

const [, , file, out, shirtStartArg] = process.argv;
const { matrix } = JSON.parse(readFileSync(file, 'utf8'));
const shirtStart = Number(shirtStartArg ?? 26);
const H = matrix.length;
const W = matrix[0].length;
const grid = matrix.map((r) => [...r]);

// Flood-fill background from the border through light clusters.
const isLight = (c) => c === 'h' || c === 'i';
const bg = grid.map((r) => r.map(() => false));
const stack = [];
for (let x = 0; x < W; x++) stack.push([x, 0]);
for (let y = 0; y < H; y++) stack.push([0, y], [W - 1, y]);
while (stack.length) {
  const [x, y] = stack.pop();
  if (x < 0 || y < 0 || x >= W || y >= H || bg[y][x] || !isLight(grid[y][x])) continue;
  bg[y][x] = true;
  stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
}

const FACE = { a: 'k', b: 'h', c: 'n', d: 'D', e: 's', f: 'S', g: 'L', h: 'W', i: 'W' };
const SHIRT = { a: 'T', b: 'T', c: 't', d: 't', e: 'o', f: 'o', g: 'u', h: 'u', i: 'u' };
const result = grid.map((row, y) =>
  row.map((c, x) => (bg[y][x] ? '.' : (y >= shirtStart ? SHIRT : FACE)[c])).join(''),
);

const palette = {
  '.': null,
  k: '#15131a', // headphones, darkest hair
  h: '#3b2a22', // hair
  n: '#5e3d31', // brows, eyes, deep shadow
  D: '#8c5c49', // skin dark
  s: '#b47b62', // skin shadow
  S: '#d19a7b', // skin
  L: '#e8b998', // skin light
  W: '#f4d8c2', // highlight
  T: '#3e3429', // shirt dark
  t: '#5b4c3d', // shirt
  o: '#76644f', // shirt light
  u: '#e8e8f0', // undershirt
};
console.log(result.map((r) => `'${r}',`).join('\n'));
writeFileSync(out, JSON.stringify({ palette, matrix: result }));
