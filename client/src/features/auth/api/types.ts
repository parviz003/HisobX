import type { Role } from '@/lib/permissions';

/**
 * TODO(backend): Swagger'da javob (response) sxemalari yo'q
 * (`@ApiResponse({ type: ... })` qo'shilmagan). Quyidagi tiplar topshiriqning
 * 5.1 va 5.2-bo'limlaridagi kelishuvga tayanadi va kontrakt to'ldirilgach
 * orval generatsiyasi bilan almashtiriladi.
 */

/** Shakl haqiqiy `GET /users/me` javobidan olingan. */
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
  /** TODO(backend) 5.2-3: hozircha javobda yo'q. */
  telegramLinked?: boolean;
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

/**
 * TODO(backend) 5.2-3: Telegram ulanmagan — avval botga ulanish kerak.
 * Hozircha faqat MSW mock'ida mavjud.
 */
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

/** TODO(backend) 5.2-3: `GET /auth/telegram-link-status?token=` */
export type TelegramLinkStatus = {
  linked: boolean;
  expiresAt?: string;
  resendAvailableAt?: string;
};

/**
 * Shakl haqiqiy `GET /device` javobidan olingan:
 * `{ deviceId, device, createdAt }`.
 *
 * TODO(backend): javobda `lastActiveAt`, `ip` va `isCurrent` yo'q. Ularsiz
 * "Joriy qurilma" belgisini ko'rsatib bo'lmaydi va foydalanuvchi qaysi
 * qurilmani chiqarayotganini aniq bilmaydi (topshiriq 2.7).
 */
export type Device = {
  deviceId: number;
  /** Erkin matn, masalan "Chrome Desktop Device". */
  device: string | null;
  createdAt: string | null;
  lastActiveAt?: string | null;
  ip?: string | null;
  isCurrent?: boolean;
};

/**
 * Qurilma limiti to'lganda backend 4xx bilan shu ma'lumotni qaytaradi.
 * TODO(backend): xato javobining aniq shakli Swagger'da hujjatlashtirilmagan.
 */
export type DeviceLimitPayload = {
  devices: Device[];
  limit?: number;
};
