import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tokenContrast } from './color';

// Tokenlar haqiqiy manbadan o'qiladi, nusxadan emas. `?raw` import ish bermaydi —
// Tailwind plaginidan o'tgan CSS bo'sh qaytadi, shuning uchun fayl to'g'ridan o'qiladi.
const CSS = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');

/**
 * Dizayn tizimining "kontrast WCAG AA dan past emas" qoidasi shu yerda tekshiriladi.
 * Tokenlar `src/index.css` dan o'qiladi — ya'ni test haqiqiy manbani sinaydi,
 * nusxa qilingan ro'yxatni emas.
 */

function tokensOf(selector: string): Record<string, string> {
  const block = new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\n\\}`).exec(CSS);
  if (!block) throw new Error(`index.css'da ${selector} bloki topilmadi`);

  const tokens: Record<string, string> = {};
  for (const [, name, value] of block[1].matchAll(/(--[\w-]+):\s*(oklch\([^)]*\));/g)) {
    tokens[name] = value;
  }
  return tokens;
}

const THEMES = {
  light: tokensOf(':root'),
  dark: tokensOf('\\.dark'),
};

/** Matn uchun AA: 4.5:1. */
const TEXT_PAIRS: readonly (readonly [string, string])[] = [
  // Asosiy sirtlar
  ['--foreground', '--background'],
  ['--card-foreground', '--card'],
  ['--popover-foreground', '--popover'],
  ['--muted-foreground', '--background'],
  ['--muted-foreground', '--card'],
  ['--muted-foreground', '--muted'],
  ['--secondary-foreground', '--secondary'],
  ['--accent-foreground', '--accent'],
  ['--sidebar-foreground', '--sidebar'],
  ['--sidebar-accent-foreground', '--sidebar-accent'],

  // To'ldirilgan (solid) elementlar — tugmalar, badge'lar
  ['--primary-foreground', '--primary'],
  ['--destructive-foreground', '--destructive'],
  ['--success-foreground', '--success'],
  ['--warning-foreground', '--warning'],
  ['--info-foreground', '--info'],
  ['--sidebar-primary-foreground', '--sidebar-primary'],

  // Semantik ranglar matn sifatida: pul summalari, holat yozuvlari, havolalar
  ['--primary', '--background'],
  ['--primary', '--card'],
  ['--success', '--background'],
  ['--success', '--card'],
  ['--warning', '--background'],
  ['--warning', '--card'],
  ['--info', '--background'],
  ['--info', '--card'],
  ['--destructive', '--background'],
  ['--destructive', '--card'],
  ['--money-in', '--background'],
  ['--money-in', '--card'],
  ['--money-out', '--background'],
  ['--money-out', '--card'],
  ['--debt', '--background'],
  ['--debt', '--card'],
];

/** Interfeys elementlari va focus halqasi uchun AA: 3:1 (WCAG 1.4.11). */
const UI_PAIRS: readonly (readonly [string, string])[] = [
  ['--ring', '--background'],
  ['--ring', '--card'],
  // Grafik belgilar (chiziq, ustun, sektor) — grafik obyektlar, matn emas
  ['--chart-1', '--card'],
  ['--chart-2', '--card'],
  ['--chart-3', '--card'],
  ['--chart-4', '--card'],
  ['--chart-5', '--card'],
];

describe.each(Object.entries(THEMES))('%s mavzu tokenlari', (_theme, tokens) => {
  it.each(TEXT_PAIRS)('%s / %s — matn uchun ≥ 4.5:1', (foreground, background) => {
    const ratio = tokenContrast(tokens[foreground], tokens[background]);
    expect(Number(ratio.toFixed(2))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(UI_PAIRS)('%s / %s — interfeys uchun ≥ 3:1', (foreground, background) => {
    const ratio = tokenContrast(tokens[foreground], tokens[background]);
    expect(Number(ratio.toFixed(2))).toBeGreaterThanOrEqual(3);
  });

  it('har bir juftlik uchun token mavjud', () => {
    for (const [a, b] of [...TEXT_PAIRS, ...UI_PAIRS]) {
      expect(tokens[a], a).toBeDefined();
      expect(tokens[b], b).toBeDefined();
    }
  });
});
