/**
 * E2E testlari uchun muhit.
 *
 * `src/config` moduli import qilinishi bilan `process.env` ni o'qiydi,
 * shuning uchun bu fayl Jest'ning `setupFiles` bosqichida — ya'ni test
 * modullaridan OLDIN ishlaydi.
 */
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../.env') });

/** Testlar alohida bazada ishlaydi — dev bazasiga tegilmaydi */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://postgres:1234@localhost:5432/hisobx_e2e';

/** Redis'ning alohida DB indeksi (dev kalitlari bilan aralashmasligi uchun) */
export const TEST_REDIS_URL =
  process.env.TEST_REDIS_URL ?? 'redis://localhost:6379/15';

process.env.NODE_ENV = 'development'; // OTP kodi javobda qaytishi uchun
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.REDIS_URL = TEST_REDIS_URL;

// Testlarni rate limit to'sib qo'ymasligi uchun keng limitlar
process.env.RATE_LIMIT_USER_LIMIT = '100000';
process.env.RATE_LIMIT_ANON_LIMIT = '100000';
process.env.RATE_LIMIT_STRICT_LIMIT = '100000';
process.env.LOGIN_MAX_FAILED_ATTEMPTS = '1000';

// OTP: testlar ketma-ket kod so'rashi uchun cooldown nolga yaqin
process.env.OTP_RESEND_COOLDOWN_SECONDS = '1';
process.env.OTP_TTL_SECONDS = '120';
process.env.OTP_MAX_ATTEMPTS = '3';

process.env.DEVICE_LIMIT_PER_USER = '3';
process.env.DEVICE_REMOVAL_MIN_AGE_HOURS = '24';

// Telegramga haqiqiy so'rov ketmasin va bot polling'i ishga tushmasin
process.env.BOT_TOKEN = '';
process.env.TELEGRAM_BOT_TOKEN = '';
process.env.TELEGRAM_BOT_USERNAME = 'hisobx_test_bot';
process.env.TELEGRAM_MODE = 'off';
// Testlar qat'iy oqimni sinaydi — dev zaxira yo'li o'chiriladi
process.env.TELEGRAM_DEV_FALLBACK = 'false';
process.env.CHAT_ID = '';
