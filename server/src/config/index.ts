import { config } from 'dotenv';
config();

export const env = {
  NODE_ENV: String(process.env.NODE_ENV ?? 'development'),
  IS_DEV: String(process.env.NODE_ENV ?? 'development') !== 'production',
  PORT: Number(process.env.PORT),
  DB_URI: String(process.env.DATABASE_URL),
  REDIS_URL: String(process.env.REDIS_URL),
  BASE_URL: String(process.env.BASE_URL),
  FILE_PATH: String(process.env.FILE_PATH),
  SUPERADMIN: {
    PHONE: String(process.env.SUPERADMIN_PHONE),
    PASSWORD: String(process.env.SUPERADMIN_PASSWORD),
  },
  TELEGRAM: {
    TOKEN: String(process.env.BOT_TOKEN),
    ID: Number(process.env.CHAT_ID),
  },
  OTP: {
    // Amal qilish muddati (sekund)
    TTL_SECONDS: Number(process.env.OTP_TTL_SECONDS ?? 60),
    // Qayta yuborish oralig'i (sekund)
    RESEND_COOLDOWN_SECONDS: Number(
      process.env.OTP_RESEND_COOLDOWN_SECONDS ?? 60,
    ),
    // Bitta kod uchun urinishlar soni
    MAX_ATTEMPTS: Number(process.env.OTP_MAX_ATTEMPTS ?? 3),
    /*
     * Parol tekshiruvidan o'tgan urinish qancha vaqt "ochiq" turadi.
     * OTP TTL'dan uzunroq bo'lishi kerak, aks holda kod eskirgach
     * foydalanuvchi kodni qayta yubora olmaydi (cooldown = TTL holati).
     */
    PENDING_WINDOW_SECONDS: Number(
      process.env.OTP_PENDING_WINDOW_SECONDS ?? 600,
    ),
    SECRET: String(process.env.OTP_SECRET),
  },

  TOKEN: {
    ACCESS_KEY: String(process.env.JWT_ACCESS_SECRET),
    // "15m", "1h", "7d" ko'rinishida
    ACCESS_TTL: String(
      process.env.ACCESS_TOKEN_TTL ?? process.env.ACCESS_TOKEN_TIME ?? '15m',
    ),
    REFRESH_KEY: String(process.env.JWT_REFRESH_SECRET),
    REFRESH_TTL: String(
      process.env.REFRESH_TOKEN_TTL ?? process.env.REFRESH_TOKEN_TIME ?? '7d',
    ),
    /** Rotatsiyadan keyin eski refresh token qabul qilinadigan oyna (sekund) */
    REFRESH_GRACE_SECONDS: Number(process.env.REFRESH_GRACE_SECONDS ?? 30),
  },
  /** CORS: faqat aniq ko'rsatilgan frontend origin(lar)i */
  CORS_ORIGINS: String(process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  /** Rate limiting (@nestjs/throttler, storage: Redis) */
  RATE_LIMIT: {
    // Umumiy oyna (sekund)
    TTL_SECONDS: Number(process.env.RATE_LIMIT_TTL_SECONDS ?? 60),
    // Autentifikatsiyalangan foydalanuvchi (userId) uchun limit
    USER_LIMIT: Number(process.env.RATE_LIMIT_USER_LIMIT ?? 120),
    // Anonim so'rovlar uchun IP boshiga limit
    ANON_LIMIT: Number(process.env.RATE_LIMIT_ANON_LIMIT ?? 30),
    // Qattiq limit (sign-in, OTP, parol tiklash): IP + telefon
    STRICT_TTL_SECONDS: Number(process.env.RATE_LIMIT_STRICT_TTL_SECONDS ?? 60),
    STRICT_LIMIT: Number(process.env.RATE_LIMIT_STRICT_LIMIT ?? 3),
  },
  /** Sign-in'dagi ketma-ket xato parollar uchun blok */
  LOGIN: {
    MAX_FAILED_ATTEMPTS: Number(process.env.LOGIN_MAX_FAILED_ATTEMPTS ?? 5),
    BLOCK_MINUTES: Number(process.env.LOGIN_BLOCK_MINUTES ?? 15),
  },
  /** Proxy ortida haqiqiy IP olish uchun (0 = o'chirilgan) */
  TRUST_PROXY: process.env.TRUST_PROXY ?? '1',
  SMTP: {
    PORT: Number(process.env.SMTP_PORT),
    HOST: String(process.env.SMTP_HOST),
    FROM: String(process.env.SMTP_FROM),
    PASSWORD: String(process.env.SMTP_PASSWORD),
  },
};
