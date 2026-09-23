/**
 * Dizayn tokenlari uchun rang yordamchilari.
 *
 * `src/index.css` dagi barcha tokenlar oklch formatida. Bu yerdagi funksiyalar
 * ularni sRGB ga o'girib, WCAG kontrast nisbatini hisoblaydi — shunda
 * "kontrast AA dan past emas" qoidasi testda avtomatik tekshiriladi.
 * Kutubxona qo'shilmaydi: hammasi qo'lda, formulalar CSS Color 4 spetsifikatsiyasidan.
 */

/** Chiziqli sRGB kanallari (0–1, gamut tashqarisida bo'lishi mumkin). */
export type LinearRgb = readonly [number, number, number];

export type Oklch = {
  l: number;
  c: number;
  h: number;
  /** 0–1 oralig'ida; berilmasa 1. */
  alpha: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** `oklch(0.596 0.145 163.225)` yoki `oklch(1 0 0 / 12%)` ko'rinishidagi qiymatni o'qiydi. */
export function parseOklch(value: string): Oklch {
  const match = /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)(%?)\s*)?\)/.exec(value);
  if (!match) throw new Error(`oklch qiymati o'qilmadi: ${value}`);

  const [, l, c, h, rawAlpha, percent] = match;
  const alpha = rawAlpha === undefined ? 1 : Number(rawAlpha) / (percent === '%' ? 100 : 1);

  return { l: Number(l), c: Number(c), h: Number(h), alpha };
}

/** Oklch → chiziqli sRGB (Oklab matritsalari, CSS Color 4). */
export function oklchToLinearRgb({ l, c, h }: Pick<Oklch, 'l' | 'c' | 'h'>): LinearRgb {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);

  const lCone = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mCone = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const sCone = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    4.0767416621 * lCone - 3.3077115913 * mCone + 0.2309699292 * sCone,
    -1.2684380046 * lCone + 2.6097574011 * mCone - 0.3413193965 * sCone,
    -0.0041960863 * lCone - 0.7034186147 * mCone + 1.707614701 * sCone,
  ];
}

/** Yarim shaffof rangni fon ustiga qo'yadi (alpha compositing, chiziqli fazoda). */
export function compositeOver(top: LinearRgb, topAlpha: number, bottom: LinearRgb): LinearRgb {
  return [
    top[0] * topAlpha + bottom[0] * (1 - topAlpha),
    top[1] * topAlpha + bottom[1] * (1 - topAlpha),
    top[2] * topAlpha + bottom[2] * (1 - topAlpha),
  ];
}

/** WCAG nisbiy yorqinligi. Kirish allaqachon chiziqli sRGB. */
export function relativeLuminance([r, g, b]: LinearRgb): number {
  return 0.2126 * clamp01(r) + 0.7152 * clamp01(g) + 0.0722 * clamp01(b);
}

/** WCAG 2.1 kontrast nisbati (1–21). */
export function contrastRatio(a: LinearRgb, b: LinearRgb): number {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);

  return (lighter + 0.05) / (darker + 0.05);
}

/** Token qiymatini to'g'ridan-to'g'ri fon ustidagi chiziqli sRGB ga aylantiradi. */
export function tokenToRgb(value: string, background?: LinearRgb): LinearRgb {
  const color = parseOklch(value);
  const rgb = oklchToLinearRgb(color);

  if (color.alpha >= 1 || !background) return rgb;
  return compositeOver(rgb, color.alpha, background);
}

/** Ikki token orasidagi kontrast. Yarim shaffof token `background` ustiga qo'yiladi. */
export function tokenContrast(foreground: string, background: string): number {
  const backgroundRgb = tokenToRgb(background);
  return contrastRatio(tokenToRgb(foreground, backgroundRgb), backgroundRgb);
}
