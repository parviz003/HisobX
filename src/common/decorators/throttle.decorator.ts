import { SetMetadata } from '@nestjs/common';

export const STRICT_RATE_LIMIT_KEY = 'strictRateLimit';

/**
 * Qattiq rate limit (IP + telefon raqami bo'yicha):
 * sign-in, OTP tasdiqlash/qayta yuborish, parolni tiklash endpointlari uchun.
 */
export const StrictRateLimit = () => SetMetadata(STRICT_RATE_LIMIT_KEY, true);
