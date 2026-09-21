import { config } from 'dotenv';
config();

export const env = {
  PORT: Number(process.env.PORT) || 3000,
  DB_URI: String(process.env.DATABASE_URL || process.env.DB_URI),
  REDIS_URL: String(process.env.REDIS_URL || 'redis://localhost:6379'),
  BASE_URL: String(process.env.BASE_URL || 'http://localhost:3000'),
  FILE_PATH: String(process.env.FILE_PATH || 'uploads'),
  SUPERADMIN: {
    PHONE: String(process.env.SUPERADMIN_PHONE || '+998900000000'),
    PASSWORD: String(process.env.SUPERADMIN_PASSWORD || 'SuperSecret123!'),
  },
  TELEGRAM: {
    TOKEN: String(
      process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '',
    ),
    ID: Number(process.env.CHAT_ID || 0),
  },
  OTP: {
    TTL: Number(process.env.OTP_TTL) || 120,
    RESEND: Number(process.env.OTP_RESEND) || 60,
    ATTEMPTS: Number(process.env.OTP_ATTEMPTS) || 3,
    SECRET: String(process.env.OTP_SECRET || 'hisobx-otp-super-secret'),
  },
  ESKIZ: {
    BASE_URL: String(process.env.ESKIZ_BASE_URL || 'https://notify.eskiz.uz'),
    EMAIL: String(process.env.ESKIZ_EMAIL || ''),
    PASSWORD: String(process.env.ESKIZ_PASSWORD || ''),
    FROM: String(process.env.ESKIZ_FROM || '4546'),
  },
  TOKEN: {
    ACCESS_KEY: String(process.env.JWT_ACCESS_SECRET || 'hisobx-access-secret'),
    ACCESS_TIME: String(process.env.ACCESS_TOKEN_TIME || '1d'),
    REFRESH_KEY: String(
      process.env.JWT_REFRESH_SECRET || 'hisobx-refresh-secret',
    ),
    REFRESH_TIME: String(process.env.REFRESH_TOKEN_TIME || '7d'),
  },
  SMTP: {
    PORT: Number(process.env.SMTP_PORT) || 587,
    HOST: String(process.env.SMTP_HOST || 'smtp.gmail.com'),
    FROM: String(process.env.SMTP_FROM || ''),
    PASSWORD: String(process.env.SMTP_PASSWORD || ''),
  },
};
