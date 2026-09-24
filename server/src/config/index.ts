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
    TOKEN: String(
      process.env.TELEGRAM_BOT_TOKEN ?? process.env.BOT_TOKEN ?? '',
    ),
    BOT_USERNAME: String(process.env.TELEGRAM_BOT_USERNAME ?? ''),
    MODE: String(process.env.TELEGRAM_MODE ?? 'polling'),
    ID: Number(process.env.CHAT_ID),
    LINK_TTL_SECONDS: Number(process.env.TELEGRAM_LINK_TTL_SECONDS ?? 600),

    DEV_FALLBACK: process.env.TELEGRAM_DEV_FALLBACK !== 'false',
  },
  OTP: {
    TTL_SECONDS: Number(process.env.OTP_TTL_SECONDS ?? 60),
    RESEND_COOLDOWN_SECONDS: Number(
      process.env.OTP_RESEND_COOLDOWN_SECONDS ?? 60,
    ),
    MAX_ATTEMPTS: Number(process.env.OTP_MAX_ATTEMPTS ?? 3),

    PENDING_WINDOW_SECONDS: Number(
      process.env.OTP_PENDING_WINDOW_SECONDS ?? 600,
    ),
    SECRET: String(process.env.OTP_SECRET),
  },

  DEVICE: {
    LIMIT_PER_USER: Number(process.env.DEVICE_LIMIT_PER_USER ?? 3),
    REMOVAL_MIN_AGE_HOURS: Number(
      process.env.DEVICE_REMOVAL_MIN_AGE_HOURS ?? 24,
    ),
  },

  TOKEN: {
    ACCESS_KEY: String(process.env.JWT_ACCESS_SECRET),
    ACCESS_TTL: String(
      process.env.ACCESS_TOKEN_TTL ?? process.env.ACCESS_TOKEN_TIME ?? '15m',
    ),
    REFRESH_KEY: String(process.env.JWT_REFRESH_SECRET),
    REFRESH_TTL: String(
      process.env.REFRESH_TOKEN_TTL ?? process.env.REFRESH_TOKEN_TIME ?? '7d',
    ),
    REFRESH_GRACE_SECONDS: Number(process.env.REFRESH_GRACE_SECONDS ?? 30),
  },
  CORS_ORIGINS: String(process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  RATE_LIMIT: {
    TTL_SECONDS: Number(process.env.RATE_LIMIT_TTL_SECONDS ?? 60),
    USER_LIMIT: Number(process.env.RATE_LIMIT_USER_LIMIT ?? 120),
    ANON_LIMIT: Number(process.env.RATE_LIMIT_ANON_LIMIT ?? 30),
    STRICT_TTL_SECONDS: Number(process.env.RATE_LIMIT_STRICT_TTL_SECONDS ?? 60),
    STRICT_LIMIT: Number(process.env.RATE_LIMIT_STRICT_LIMIT ?? 3),
  },
  LOGIN: {
    MAX_FAILED_ATTEMPTS: Number(process.env.LOGIN_MAX_FAILED_ATTEMPTS ?? 5),
    BLOCK_MINUTES: Number(process.env.LOGIN_BLOCK_MINUTES ?? 15),
  },
  TRUST_PROXY: process.env.TRUST_PROXY ?? '1',
  SMTP: {
    PORT: Number(process.env.SMTP_PORT),
    HOST: String(process.env.SMTP_HOST),
    FROM: String(process.env.SMTP_FROM),
    PASSWORD: String(process.env.SMTP_PASSWORD),
  },
};
