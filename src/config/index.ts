import { config } from 'dotenv';
config();

export const env = {
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
      process.env.BOT_TOKEN,
    ),
    ID: Number(process.env.CHAT_ID),
  },
  OTP: {
    TTL: Number(process.env.OTP_TTL),
    RESEND: Number(process.env.OTP_RESEND),
    ATTEMPTS: Number(process.env.OTP_ATTEMPTS),
    SECRET: String(process.env.OTP_SECRET),
  },

  TOKEN: {
    ACCESS_KEY: String(process.env.JWT_ACCESS_SECRET),
    ACCESS_TIME: String(process.env.ACCESS_TOKEN_TIME),
    REFRESH_KEY: String(
      process.env.JWT_REFRESH_SECRET,
    ),
    REFRESH_TIME: String(process.env.REFRESH_TOKEN_TIME),
  },
  SMTP: {
    PORT: Number(process.env.SMTP_PORT),
    HOST: String(process.env.SMTP_HOST),
    FROM: String(process.env.SMTP_FROM),
    PASSWORD: String(process.env.SMTP_PASSWORD),
  },
};
