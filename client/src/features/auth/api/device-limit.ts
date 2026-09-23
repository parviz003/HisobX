import type { ApiError } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/format';
import type { Device, DeviceLimitPayload } from './types';

/**
 * Qurilma limiti to'lganda backend `DEVICE_LIMIT_REACHED` kodi bilan
 * 403 qaytaradi va `data` ichida qurilmalar ro'yxatini beradi.
 */
export const DEVICE_LIMIT_CODE = 'DEVICE_LIMIT_REACHED';

/** Qurilmani o'chirishda chiqadigan xato kodlari */
export const DEVICE_REMOVAL_TOO_EARLY = 'DEVICE_REMOVAL_TOO_EARLY';
export const DEVICE_CURRENT_CANNOT_BE_REMOVED = 'DEVICE_CURRENT_CANNOT_BE_REMOVED';

function payloadOf(error: ApiError): DeviceLimitPayload | null {
  const details = error.details;
  if (details === null || typeof details !== 'object') return null;
  return (details as { data?: DeviceLimitPayload }).data ?? null;
}

export function isDeviceLimitError(error: ApiError): boolean {
  return error.code === DEVICE_LIMIT_CODE;
}

/**
 * Xatodagi qurilmalar ro'yxati. Limit xatosi bo'lsa-yu ro'yxat kelmagan
 * bo'lsa, bo'sh massiv qaytadi — oyna baribir ochiladi.
 */
export function deviceLimitDevices(error: ApiError): Device[] | null {
  if (!isDeviceLimitError(error)) return null;
  return payloadOf(error)?.devices ?? [];
}

/** Limit soni (backend `DEVICE_LIMIT_PER_USER` dan beradi). */
export function deviceLimitCount(error: ApiError): number | undefined {
  return payloadOf(error)?.limit;
}

/**
 * `DEVICE_REMOVAL_TOO_EARLY` — qurilma qo'shilganiga 24 soat to'lmagan.
 * Javobda qachondan o'chirish mumkinligi keladi.
 */
export function removalAvailableAt(error: ApiError): string | undefined {
  const details = error.details;
  if (details === null || typeof details !== 'object') return undefined;
  const data = (details as { data?: { canRemoveAt?: string } }).data;
  return data?.canRemoveAt;
}

/**
 * Qurilmani chiqarib yuborishda chiqadigan xatoni tushunarli xabarga o'giradi.
 * Komponent shu kalitni `t()` ga uzatadi.
 */
export function deviceRemovalMessage(error: ApiError): {
  key: string;
  params?: Record<string, string>;
} {
  if (error.code === DEVICE_CURRENT_CANNOT_BE_REMOVED) {
    return { key: 'auth:deviceLimit.errors.current' };
  }

  if (error.code === DEVICE_REMOVAL_TOO_EARLY) {
    const availableAt = removalAvailableAt(error);
    return availableAt
      ? {
          key: 'auth:deviceLimit.errors.tooEarly',
          params: { value: formatDateTime(availableAt) },
        }
      : { key: 'auth:deviceLimit.errors.tooEarlyNoDate' };
  }

  return { key: 'auth:deviceLimit.errors.generic' };
}
