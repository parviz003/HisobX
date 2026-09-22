/**
 * Testlar uchun toza baza tayyorlaydi:
 * bazani qayta yaratadi va migratsiyalarni `prisma migrate deploy` bilan
 * qo'llaydi. Shu tariqa migratsiyalar zanjiri har test yugurishida
 * toza bazada tekshiriladi.
 *
 * Administrativ so'rovlar (`DROP`/`CREATE DATABASE`) Prisma Client orqali
 * `postgres` bazasiga ulanib bajariladi — qo'shimcha paket talab qilinmaydi.
 */
import { execSync } from 'child_process';
import { resolve } from 'path';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

config({ path: resolve(__dirname, '../../.env') });

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://postgres:1234@localhost:5432/hisobx_e2e';

export default async function globalSetup() {
  const url = new URL(TEST_DATABASE_URL);
  const dbName = url.pathname.slice(1);
  if (!dbName) {
    throw new Error('TEST_DATABASE_URL da baza nomi ko‘rsatilmagan');
  }

  const adminUrl = new URL(TEST_DATABASE_URL);
  adminUrl.pathname = '/postgres';

  const admin = new PrismaClient({
    adapter: new PrismaPg({ connectionString: adminUrl.toString() }),
  });
  try {
    // Ochiq ulanishlar bazani o'chirishga to'sqinlik qilmasligi uchun
    await admin.$executeRawUnsafe(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity
       WHERE datname = '${dbName}' AND pid <> pg_backend_pid()`,
    );
    await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${dbName}"`);
    await admin.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`);
  } finally {
    await admin.$disconnect();
  }

  execSync('npx prisma migrate deploy', {
    cwd: resolve(__dirname, '../..'),
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}
