/**
 * Brend ikonkalarini `public/` ga chizadi: emerald fonli kvadrat + oq "H".
 *
 * Yangi kutubxona qo'shilmaydi (client/CLAUDE.md, 2-bo'lim), shuning uchun PNG
 * qo'lda yig'iladi: Node'ning `zlib` i va oddiy rastrlash yetarli — "H" uchta
 * to'rtburchakdan iborat, fon esa burchaklari yumaloqlangan kvadrat.
 * Chetlar 4x supersampling bilan silliqlanadi.
 *
 * Ishga tushirish: `pnpm icons`
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';

/** Brend rangi — `--primary` (emerald-700) ning sRGB qiymati. */
const BRAND = [0, 122, 85];
const WHITE = [255, 255, 255];
const SAMPLES = 4;

/** Nuqta burchagi yumaloqlangan kvadrat ichidami? */
function inRoundedRect(x, y, size, radius) {
  const near = (v) => Math.min(v, size - v);
  const dx = near(x);
  const dy = near(y);
  if (dx >= radius || dy >= radius) return dx >= 0 && dy >= 0;
  return (radius - dx) ** 2 + (radius - dy) ** 2 <= radius ** 2;
}

/** "H" harfi: ikki tik ustun va ularni bog'lovchi ko'ndalang. */
function inLetterH(x, y, size, scale) {
  const cx = size / 2;
  const cy = size / 2;
  const stem = size * 0.085 * scale;
  const half = size * 0.15 * scale;
  const height = size * 0.42 * scale;
  const cross = size * 0.075 * scale;

  const inHeight = Math.abs(y - cy) <= height / 2;
  const inStem = Math.abs(Math.abs(x - cx) - half) <= stem / 2;
  const inCross = Math.abs(x - cx) <= half + stem / 2 && Math.abs(y - cy) <= cross / 2;

  return (inHeight && inStem) || inCross;
}

/** Bitta ikonkani RGBA bayt massiviga chizadi. */
function render(size, { maskable }) {
  // Maskable ikonka to'liq to'ldiriladi: tizim o'zi kesadi, "H" xavfsiz zonada qoladi.
  const radius = maskable ? 0 : size * 0.22;
  const letterScale = maskable ? 0.72 : 1;
  const pixels = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let background = 0;
      let letter = 0;

      for (let sy = 0; sy < SAMPLES; sy += 1) {
        for (let sx = 0; sx < SAMPLES; sx += 1) {
          const px = x + (sx + 0.5) / SAMPLES;
          const py = y + (sy + 0.5) / SAMPLES;
          if (inRoundedRect(px, py, size, radius)) background += 1;
          if (inLetterH(px, py, size, letterScale)) letter += 1;
        }
      }

      const total = SAMPLES * SAMPLES;
      const alpha = background / total;
      const letterAlpha = Math.min(letter / total, alpha);
      const offset = (y * size + x) * 4;

      for (let channel = 0; channel < 3; channel += 1) {
        // Oq harf emerald fon ustiga qo'yiladi.
        const value = BRAND[channel] * (1 - letterAlpha) + WHITE[channel] * letterAlpha;
        pixels[offset + channel] = Math.round(value);
      }
      pixels[offset + 3] = Math.round(alpha * 255);
    }
  }

  return pixels;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function toPng(size, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit chuqurligi
  header[9] = 6; // RGBA
  // Har qator oldida filtr bayti (0 — filtrsiz).
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y += 1) {
    raw[y * (size * 4 + 1)] = 0;
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const TARGETS = [
  ['public/favicon.png', 64, { maskable: false }],
  ['public/icons/icon-192.png', 192, { maskable: false }],
  ['public/icons/icon-512.png', 512, { maskable: false }],
  ['public/icons/icon-maskable-512.png', 512, { maskable: true }],
  ['public/icons/apple-touch-icon.png', 180, { maskable: true }],
];

for (const [path, size, options] of TARGETS) {
  writeFileSync(path, toPng(size, render(size, options)));
  console.log(`${path} — ${size}×${size}`);
}
