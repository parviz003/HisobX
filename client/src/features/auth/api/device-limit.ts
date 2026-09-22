import type { ApiError } from '@/lib/api/errors';
import type { Device, DeviceLimitPayload } from './types';

/**
 * TODO(backend): qurilma limiti xatosining aniq shakli Swagger'da
 * hujjatlashtirilmagan. Hozircha ikki belgidan biri bo'yicha aniqlaymiz:
 * javobdagi `code` yoki tanadagi `devices` ro'yxati.
 */
const LIMIT_CODES = ['DEVICE_LIMIT', 'DEVICE_LIMIT_REACHED', 'TOO_MANY_DEVICES'];

function hasDeviceList(value: unknown): value is DeviceLimitPayload {
  return (
    value !== null &&
    typeof value === 'object' &&
    'devices' in value &&
    Array.isArray((value as DeviceLimitPayload).devices)
  );
}

export function deviceLimitDevices(error: ApiError): Device[] | null {
  const byCode = error.code !== undefined && LIMIT_CODES.includes(error.code);
  const details = error.details;

  if (hasDeviceList(details)) return details.devices;

  // `devices` yuborilmagan bo'lsa ham, kod bo'yicha aniqlangan bo'lsa
  // ro'yxatni alohida so'rov bilan olamiz (bo'sh massiv shuni bildiradi).
  return byCode ? [] : null;
}

export function isDeviceLimitError(error: ApiError): boolean {
  return deviceLimitDevices(error) !== null;
}
