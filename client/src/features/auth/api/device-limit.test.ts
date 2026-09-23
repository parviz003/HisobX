import { describe, expect, it } from 'vitest';
import type { ApiError } from '@/lib/api/errors';
import {
  deviceLimitCount,
  deviceLimitDevices,
  deviceRemovalMessage,
  isDeviceLimitError,
} from './device-limit';

/** Backend xatosi `{ statusCode, message, code, data }` shaklida keladi. */
function apiError(code: string, data?: unknown): ApiError {
  return {
    status: 403,
    message: 'errors.forbidden',
    code,
    details: { statusCode: 403, code, message: 'x', data },
  };
}

describe('qurilma limiti xatosi', () => {
  it("DEVICE_LIMIT_REACHED qurilmalar ro'yxatini beradi", () => {
    const error = apiError('DEVICE_LIMIT_REACHED', {
      limit: 3,
      devices: [{ deviceId: 1 }, { deviceId: 2 }],
    });

    expect(isDeviceLimitError(error)).toBe(true);
    expect(deviceLimitDevices(error)).toHaveLength(2);
    expect(deviceLimitCount(error)).toBe(3);
  });

  it("ro'yxat kelmasa ham oyna ochiladi (bo'sh massiv)", () => {
    const error = apiError('DEVICE_LIMIT_REACHED');
    expect(deviceLimitDevices(error)).toEqual([]);
  });

  it('boshqa xato limit xatosi emas', () => {
    const error = apiError('FORBIDDEN');
    expect(isDeviceLimitError(error)).toBe(false);
    expect(deviceLimitDevices(error)).toBeNull();
  });
});

describe('qurilmani chiqarib yuborish xatolari', () => {
  it('joriy qurilma uchun alohida xabar', () => {
    const message = deviceRemovalMessage(
      apiError('DEVICE_CURRENT_CANNOT_BE_REMOVED'),
    );
    expect(message.key).toBe('auth:deviceLimit.errors.current');
  });

  it('erta urinishda sana ko‘rsatiladi', () => {
    const message = deviceRemovalMessage(
      apiError('DEVICE_REMOVAL_TOO_EARLY', {
        canRemoveAt: '2026-09-24T09:30:00.000Z',
      }),
    );
    expect(message.key).toBe('auth:deviceLimit.errors.tooEarly');
    expect(message.params?.value).toContain('24.09.2026');
  });

  it('sana kelmasa umumiy matn', () => {
    const message = deviceRemovalMessage(apiError('DEVICE_REMOVAL_TOO_EARLY'));
    expect(message.key).toBe('auth:deviceLimit.errors.tooEarlyNoDate');
  });
});
