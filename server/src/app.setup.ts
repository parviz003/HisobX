import { ValidationPipe } from '@nestjs/common';
import type { INestApplication, ValidationError } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './common/filters/all-exception.filter';
import { DecimalSerializerInterceptor } from './common/interceptors/decimal-serializer.interceptor';
import { BusinessException } from './common/errors/business.exception';
import { ErrorCode } from './common/errors/error-codes';
import { ErrorResponseDto } from './common/swagger';

/** Global API prefiksi */
export const API_PREFIX = '/api/v1';

/**
 * Bootstrap sozlamalari SHU YERDA, bitta joyda turadi.
 *
 * Ishlayotgan server ham, e2e testlar ham aynan shu funksiyani chaqiradi —
 * aks holda testlar production'dan farqli sozlamada ishlab, xatoni
 * ko'rsatmay qolishi mumkin.
 */
export function applyGlobalSetup(app: INestApplication) {
  app.useGlobalPipes(buildValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  // Pul va miqdor JSON'da `number` bo'lib chiqishi uchun (kontrakt talabi)
  app.useGlobalInterceptors(new DecimalSerializerInterceptor());
  app.use(cookieParser());
  app.setGlobalPrefix(API_PREFIX);
}

/**
 * Validatsiya xatolari ham loyihaning yagona formatida chiqadi:
 * `code: VALIDATION_ERROR`, `data.fields` — xato maydonlar ro'yxati.
 */
export function buildValidationPipe() {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    exceptionFactory: (errors: ValidationError[]) => {
      const fields = flattenValidationErrors(errors);
      return BusinessException.badRequest(
        ErrorCode.VALIDATION_ERROR,
        fields[0] ?? "So'rov ma'lumotlari noto'g'ri",
        { fields },
      );
    },
  });
}

/** Ichma-ich joylashgan validatsiya xatolarini tekis ro'yxatga yig'adi */
export function flattenValidationErrors(errors: ValidationError[]): string[] {
  const messages: string[] = [];
  const walk = (list: ValidationError[]) => {
    for (const error of list) {
      if (error.constraints) {
        messages.push(...Object.values(error.constraints));
      }
      if (error.children?.length) {
        walk(error.children);
      }
    }
  };
  walk(errors);
  return messages;
}

export function buildSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('HisobX ')
    .setVersion('1.0')
    .addCookieAuth('accessToken', {
      type: 'apiKey',
      in: 'cookie',
      name: 'accessToken',
    })
    .addGlobalParameters({
      name: 'x-store-id',
      in: 'header',
      required: false,
      description:
        "Faqat SUPERADMIN uchun: do'kon konteksti (GET amallari uchun)",
      schema: { type: 'integer', example: 1 },
    })
    .addTag('Auth', 'Kirish, OTP, refresh, parolni tiklash')
    .addTag('Users', 'Profil va xodimlar boshqaruvi')
    .addTag('Stores', "Do'konlar")
    .addTag('Devices', 'Qurilmalar va sessiyalar')
    .addTag('Categories', 'Mahsulot toifalari')
    .addTag('Products', 'Mahsulotlar')
    .addTag('Inventory', 'Ombor kirim/chiqimi va qoldiqlar')
    .addTag('Customers', 'Mijozlar')
    .addTag('Sales', 'Savdolar')
    .addTag('Debts', "Nasiya va qarz to'lovlari")
    .addTag('Cash', 'Kassa balansi va harakatlari')
    .addTag('Expenses', 'Xarajatlar va ularning toifalari')
    .addTag('Reports', 'Hisobotlar')
    .addTag('Telegram Notifications', 'Telegram xabarnomalari')
    .build();
}

export function createSwaggerDocument(app: INestApplication): OpenAPIObject {
  const document = SwaggerModule.createDocument(app, buildSwaggerConfig(), {
    extraModels: [ErrorResponseDto],
  });

  document.security = [{ accessToken: [] }];
  return document;
}
