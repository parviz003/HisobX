import { Role } from '@prisma/client';

/**
 * Tannarx va foyda faqat MANAGER va ADMIN uchun ko'rinadi (ruxsatlar matritsasi).
 * SELLER mahsulot narxini ko'radi, lekin uning tannarxini emas.
 */
export function canSeeCost(role: Role): boolean {
  return role !== Role.SELLER;
}

/** Javobdan olib tashlanadigan maydonlar */
const COST_KEYS = new Set([
  'costPrice',
  'lastPurchasePrice',
  'cogs',
  'profit',
  'grossProfit',
  'netProfit',
  'markup',
]);

/**
 * SELLER uchun tannarx/foyda maydonlarini javobdan olib tashlaydi.
 * Ichma-ich joylashgan obyektlar ham qamrab olinadi (`saleItems[].costPrice`).
 */
export function hideCostFields<T>(value: T, role: Role): T {
  if (canSeeCost(role)) return value;
  return strip(value);
}

function strip<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return value;

  if (Array.isArray(value)) {
    return value.map((item) => strip(item)) as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (COST_KEYS.has(key)) continue;
    result[key] = strip(item);
  }
  return result as T;
}
