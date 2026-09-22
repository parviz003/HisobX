import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import type { ExecutionContext } from '@nestjs/common';
import { PrismaModule } from './config/database/prisma.module';
import { RedisModule } from './config/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { OtpModule } from './modules/otp/otp.module';
import { StoresModule } from './modules/stores/stores.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SalesModule } from './modules/sales/sales.module';
import { DebtsModule } from './modules/debts/debts.module';
import { CashModule } from './modules/cash/cash.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { ReportsModule } from './modules/reports/reports.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { AuthGuard } from './common/guards/jwt-auth.guard';
import {
  AppThrottlerGuard,
  DEFAULT_THROTTLER,
  STRICT_THROTTLER,
  resolveThrottleUserId,
} from './common/guards/app-throttler.guard';
import { RedisService } from './config/redis/redis.service';
import { env } from './config';
import { RolesGuard } from './common/guards/roles.guard';
import { AllExceptionsFilter } from './common/filters/all-exception.filter';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      inject: [RedisService],
      useFactory: (redis: RedisService) => ({
        storage: new ThrottlerStorageRedisService(redis.client),
        errorMessage:
          "So'rovlar soni chegaradan oshdi. Birozdan so'ng qayta urinib ko'ring",
        throttlers: [
          {
            name: DEFAULT_THROTTLER,
            ttl: env.RATE_LIMIT.TTL_SECONDS * 1000,
            // Autentifikatsiyalangan foydalanuvchiga kengroq limit
            limit: async (context: ExecutionContext) =>
              (await resolveThrottleUserId(
                context.switchToHttp().getRequest(),
              ))
                ? env.RATE_LIMIT.USER_LIMIT
                : env.RATE_LIMIT.ANON_LIMIT,
          },
          {
            name: STRICT_THROTTLER,
            ttl: env.RATE_LIMIT.STRICT_TTL_SECONDS * 1000,
            limit: env.RATE_LIMIT.STRICT_LIMIT,
          },
        ],
      }),
    }),
    PrismaModule,
    RedisModule,
    OtpModule,
    AuthModule,
    StoresModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    InventoryModule,
    CustomersModule,
    SalesModule,
    DebtsModule,
    CashModule,
    ExpensesModule,
    ReportsModule,
    TelegramModule,
  ],
  providers: [
    // Throttler birinchi ishlaydi: anonim so'rovlar ham hisobga olinadi
    { provide: APP_GUARD, useClass: AppThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
