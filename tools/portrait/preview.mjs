// Renders one or more {palette, matrix} sprites side by side into an upscaled PNG.
// Usage: node preview.mjs out.png scale a.json [b.json ...]
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const [, , out, scaleArg, ...files] = process.argv;
const scale = Number(scaleArg);
const sprites = files.map((f) => JSON.parse(readFileSync(f, 'utf8')));
const gap = 2;
const width = sprites.reduce((w, s) => w + s.matrix[0].length, 0) + gap * (sprites.length - 1);
const height = Math.max(...sprites.map((s) => s.matrix.length));
const W = width * scale;
const H = height * scale;
const rgba = Buffer.alloc(W * H * 4);
for (let i = 0; i < W * H; i++) rgba.set([40, 40, 60, 255], i * 4);

let ox = 0;
for (const s of sprites) {
  s.matrix.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const hex = s.palette[ch];
      if (!hex) return;
      const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      for (let dy = 0; dy < scale; dy++)
        for (let dx = 0; dx < scale; dx++) {
          const p = ((y * scale + dy) * W + (ox + x) * scale + dx) * 4;
          rgba.set([...c, 255], p);
        }
    });
  });
  ox += s.matrix[0].length + gap;
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr.set([8, 6, 0, 0, 0], 8);
const raw = Buffer.alloc((W * 4 + 1) * H);
for (let y = 0; y < H; y++) rgba.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4);
writeFileSync(
  out,
  Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]),
);
console.log(`wrote ${out} (${W}x${H})`);
