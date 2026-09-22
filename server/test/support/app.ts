import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/common/filters/all-exception.filter';
import { BusinessException } from '../../src/common/errors/business.exception';
import { ErrorCode } from '../../src/common/errors/error-codes';
import { PrismaService } from '../../src/config/database/prisma.service';
import { RedisService } from '../../src/config/redis/redis.service';

export const API = '/api/v1';

export interface TestContext {
  app: INestApplication;
  db: PrismaService;
  redis: RedisService;
  http: () => request.SuperTest<request.Test>;
  close: () => Promise<void>;
}

/**
 * Test ilovasi `App.main()` dagi global sozlamalarni AYNAN takrorlaydi:
 * prefix, ValidationPipe (VALIDATION_ERROR formatida), xato filtri, cookie-parser.
 * Aks holda testlar production'dan farqli xatolarni ko'rgan bo'lardi.
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

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const fields = flatten(errors);
        return BusinessException.badRequest(
          ErrorCode.VALIDATION_ERROR,
          fields[0] ?? "So'rov ma'lumotlari noto'g'ri",
          { fields },
        );
      },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.use(cookieParser());
  app.setGlobalPrefix(API);

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

function flatten(errors: ValidationError[]): string[] {
  const messages: string[] = [];
  const walk = (list: ValidationError[]) => {
    for (const error of list) {
      if (error.constraints) messages.push(...Object.values(error.constraints));
      if (error.children?.length) walk(error.children);
    }
  };
  walk(errors);
  return messages;
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
