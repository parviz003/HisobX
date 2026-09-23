import { format, parseISO } from 'date-fns';

/** Mahsulot o'lchov birliklari. `dona` butun son, qolganlari kasr qabul qiladi. */
export type Unit = 'dona' | 'kg' | 'litr';

/** `kg` va `litr` uchun verguldan keyin nechta xona ko'rsatiladi. */
export const QUANTITY_DECIMALS = 3;

const NBSP = ' ';

function toDate(value: Date | string | number): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  try {
    const d = parseISO(value);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/**
 * Pul va miqdorni songa keltiradigan YAGONA joy.
 *
 * Kontrakt bo'yicha backend bu maydonlarni `number` qaytaradi. String ham
 * qabul qilinadi — o'tish davri uchun (eski javoblar Prisma `Decimal` ni matn
 * qilib qaytarardi). Kodning boshqa joyida `Number()` yozilmaydi.
 * TODO(backend): barcha endpointlar `number` qaytarayotgani tasdiqlangach,
 * `string` varianti olib tashlanadi.
 */
export function toAmount(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/**
 * Pulni so'mda ko'rsatadi: `1 250 000 so'm`.
 * Backend butun son (so'm) qaytaradi, shuning uchun yaxlitlab ko'rsatamiz.
 */
export function formatMoney(
  value: string | number | null | undefined,
  options: { withSuffix?: boolean; sign?: boolean } = {},
): string {
  const { withSuffix = true, sign = false } = options;
  if (value === null || value === undefined || value === '') {
    return withSuffix ? `0${NBSP}so'm` : '0';
  }

  const rounded = Math.round(toAmount(value));
  const isNegative = rounded < 0;
  const digits = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);

  let prefix = '';
  if (isNegative) prefix = '−';
  else if (sign && rounded > 0) prefix = '+';

  return withSuffix ? `${prefix}${digits}${NBSP}so'm` : `${prefix}${digits}`;
}

/**
 * Miqdorni birligiga mos ko'rsatadi.
 * `dona` → `12 dona`; `kg`/`litr` → `1,25 kg` (ortiqcha nollar kesiladi).
 */
export function formatQuantity(
  value: string | number | null | undefined,
  unit: Unit = 'dona',
  options: { withUnit?: boolean } = {},
): string {
  const { withUnit = true } = options;
  const safe = toAmount(value);

  let text: string;
  if (unit === 'dona') {
    text = Math.round(safe).toString();
  } else {
    const fixed = safe.toFixed(QUANTITY_DECIMALS);
    // `1.250` → `1.25`, `2.000` → `2`
    text = fixed.replace(/\.?0+$/, '').replace('.', ',');
    if (text === '' || text === '-') text = '0';
  }

  return withUnit ? `${text}${NBSP}${unit}` : text;
}

/** Foydalanuvchi kiritgan miqdorni songa o'giradi (vergul ham, nuqta ham qabul qilinadi). */
export function parseQuantity(input: string, unit: Unit = 'dona'): number | null {
  const normalized = input.trim().replace(',', '.');
  if (normalized === '') return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  if (unit === 'dona') return Number.isInteger(parsed) ? parsed : null;
  return Math.round(parsed * 10 ** QUANTITY_DECIMALS) / 10 ** QUANTITY_DECIMALS;
}

/** `DD.MM.YYYY` */
export function formatDate(value: Date | string | number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const date = toDate(value);
  return date ? format(date, 'dd.MM.yyyy') : '—';
}

/** `DD.MM.YYYY HH:mm` */
export function formatDateTime(value: Date | string | number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const date = toDate(value);
  return date ? format(date, 'dd.MM.yyyy HH:mm') : '—';
}

/** Telefonni o'qishga qulay ko'rinishga keltiradi: `+998 90 123 45 67`. */
export function formatPhone(value: string | null | undefined): string {
  if (!value) return '—';
  const digits = value.replace(/\D/g, '');
  const local = digits.startsWith('998') ? digits.slice(3) : digits;
  if (local.length !== 9) return value;
  return `+998 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 7)} ${local.slice(7, 9)}`;
}

/** Maskadan backend kutadigan formatga: `+998901234567`. */
export function toApiPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  const local = digits.startsWith('998') ? digits.slice(3) : digits;
  return `+998${local}`;
}

/** Foizni ko'rsatadi: `+12,5%` / `−3%`. */
export function formatPercent(value: number | null | undefined, withSign = true): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const rounded = Math.round(value * 10) / 10;
  const text = Math.abs(rounded).toString().replace('.', ',');
  if (rounded < 0) return `−${text}%`;
  return withSign && rounded > 0 ? `+${text}%` : `${text}%`;
}
