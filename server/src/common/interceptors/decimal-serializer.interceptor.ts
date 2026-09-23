import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Prisma `Decimal` qiymatlarini JSON'ga chiqishdan oldin `number` ga o'giradi.
 *
 * Kontraktda pul va miqdor maydonlari `number` (string emas). Prisma esa
 * `Decimal` obyektini qaytaradi va u JSON.stringify'da string bo'lib ketadi.
 * Shuning uchun o'girish BITTA markaziy joyda — har DTO'da alohida emas.
 *
 * Aniqlik: pul `Decimal(15,2)`, miqdor `Decimal(12,3)`. Ularning `Number`
 * ko'rinishi `Number.MAX_SAFE_INTEGER` (~9.0e15) ichida qoladi, ya'ni
 * o'girishda aniqlik yo'qolmaydi. Chegaradan chiqqan qiymat kutilmagan
 * ma'lumot demak — bunda xato tashlanadi, jimgina noto'g'ri son qaytarilmaydi.
 */
@Injectable()
export class DecimalSerializerInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => toPlainNumbers(data)));
  }
}

function decimalToNumber(value: Prisma.Decimal): number {
  const result = value.toNumber();
  if (!Number.isFinite(result) || Math.abs(result) > Number.MAX_SAFE_INTEGER) {
    throw new Error(
      `Decimal qiymati xavfsiz son chegarasidan chiqdi: ${value.toString()}`,
    );
  }
  return result;
}

/**
 * Massiv va oddiy obyektlarni rekursiv aylanib chiqadi.
 * `Date`, `Buffer` va boshqa maxsus turlar o'zgarishsiz qoladi — ular JSON'ga
 * o'z qoidasi bilan chiqadi.
 */
export function toPlainNumbers<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;

  if (Prisma.Decimal.isDecimal(value)) {
    return decimalToNumber(value as unknown as Prisma.Decimal) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => toPlainNumbers(item)) as T;
  }

  if (value instanceof Date || Buffer.isBuffer(value)) return value;

  // Qolganlari — Prisma natijalari va DTO'lar: JSON'ga chiqishi oldidan
  // oddiy obyektga ko'chiriladi.
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    result[key] = toPlainNumbers(item);
  }
  return result as T;
}
