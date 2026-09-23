import { INestApplication, Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { API_PREFIX, applyGlobalSetup } from '../../src/app.setup';
import { PrismaService } from '../../src/config/database/prisma.service';
import { RedisService } from '../../src/config/redis/redis.service';

export const API = API_PREFIX;

export interface TestContext {
  app: INestApplication;
  db: PrismaService;
  redis: RedisService;
  http: () => request.SuperTest<request.Test>;
  close: () => Promise<void>;
}

/**
 * Test ilovasi global sozlamalarni `applyGlobalSetup` dan OLADI — ya'ni
 * ishlayotgan server bilan bitta manbadan. Sozlamalar bu yerda takrorlansa,
 * production'da yo'q narsa testda "ishlab" turgan bo'lardi.
 */
export async function createTestApp(): Promise<TestContext> {
  /*
   * Testlar ataylab xato javoblarni ham tekshiradi, va har biri
   * AllExceptionsFilter tomonidan logga yoziladi. Chiqishni o'qiy olish
   * uchun loglarni o'chiramiz (`DEBUG_TEST_LOGS=1` bilan yoqish mumkin).
   */
  if (!process.env.DEBUG_TEST_LOGS) {
    Logger.overrideLogger(false);
  }

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication({
    logger: process.env.DEBUG_TEST_LOGS ? undefined : false,
  });

  applyGlobalSetup(app);

  await app.init();

  const db = app.get(PrismaService);
  const redis = app.get(RedisService);

  return {
    app,
    db,
    redis,
    http: () => request(app.getHttpServer() as App) as any,
    close: async () => {
      await app.close();
    },
  };
}

/** Testlar orasida bazani tozalaydi (SUPERADMIN saqlanib qoladi) */
export async function resetDatabase(db: PrismaService) {
  await db.$transaction([
    db.debtPayment.deleteMany(),
    db.debt.deleteMany(),
    db.saleItem.deleteMany(),
    db.cashTransaction.deleteMany(),
    db.sale.deleteMany(),
    db.inventoryTransaction.deleteMany(),
    db.expense.deleteMany(),
    db.expenseCategory.deleteMany(),
    db.product.deleteMany(),
    db.category.deleteMany(),
    db.customer.deleteMany(),
    db.notification.deleteMany(),
    db.devices.deleteMany(),
    db.user.deleteMany({ where: { role: { not: 'SUPERADMIN' } } }),
    db.store.deleteMany(),
  ]);
}

/** Test bloklari orasida OTP/rate-limit kalitlarini tozalaydi */
export async function resetRedis(redis: RedisService) {
  await redis.client.flushdb();
}
