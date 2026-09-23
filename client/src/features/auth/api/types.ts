import type {
  AuthControllerConfirmSignIn403Data,
  DeviceResponseDto,
} from '@/lib/api/generated/model';
import type { Role } from '@/lib/permissions';

/**
 * Domen tiplari kontraktdan (orval generatsiyasi) olinadi; bu yerda faqat
 * `role` toraytiriladi va sign-in javobining ikki varianti ajratiladi.
 */

/** `GET /users/me` */
export type CurrentUser = {
  id: number;
  fullName: string;
  name?: string | null;
  phone: string;
  role: Role;
  status: 'ACTIVE' | 'INACTIVE';
  isActive?: boolean;
  storeId: number | null;
  /** `/api/v1/uploads/...` ko'rinishidagi manzil. */
  imageUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  store?: { id: number; name: string } | null;
  /** Hisob Telegram botga ulanganmi. Chat IDsi hech qachon qaytarilmaydi. */
  telegramLinked: boolean;
};

/** Telegram ulangan — kod botga yuborildi. */
export type SignInOtpSent = {
  telegramLinked?: true;
  /** Kod qachon eskiradi (ISO). */
  expiresAt: string;
  /** Qayta yuborish qachondan mumkin (ISO). */
  resendAvailableAt: string;
  /** Urinish oynasi (10 daqiqa) qachon tugaydi (ISO). */
  windowExpiresAt?: string;
  /** Faqat dev rejimida keladi. */
  code?: string;
};

/** Telegram ulanmagan — kod yuborilmaydi, avval botga ulanish kerak. */
export type SignInTelegramLinkRequired = {
  telegramLinked: false;
  linkToken: string;
  /** `https://t.me/<bot>?start=<linkToken>` */
  botUrl: string;
  linkExpiresAt: string;
};

export type SignInResponse = SignInOtpSent | SignInTelegramLinkRequired;

export function isTelegramLinkRequired(
  response: SignInResponse,
): response is SignInTelegramLinkRequired {
  return response.telegramLinked === false;
}

/** `GET /auth/telegram-link-status?token=` */
export type TelegramLinkStatus = {
  linked: boolean;
  expiresAt?: string;
  resendAvailableAt?: string;
};

/** `GET /device` — sessiya qurilmasi */
export type Device = DeviceResponseDto;

/** Qurilma limiti to'lganda `DEVICE_LIMIT_REACHED` xatosining `data` qismi */
export type DeviceLimitPayload = AuthControllerConfirmSignIn403Data;
