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
    .setTitle('HisobX Mini Store Management SaaS API')
    .setDescription(
      [
        'Marketplace uslubidagi modular monolit API.',
        '',
        '**Autentifikatsiya:** cookie-based JWT. `POST /auth/signin` -> OTP -> ',
        "`POST /auth/confirm` so'ng `accessToken` va `refreshToken` httpOnly ",
        'cookie sifatida yoziladi. So\'rovlarni `credentials: "include"` bilan yuboring.',
        '',
        "**Rollar:** SUPERADMIN (platforma), ADMIN (do'kon egasi), SELLER (sotuvchi).",
        '',
        "**x-store-id:** faqat SUPERADMIN uchun — do'kon kontekstida O'QISH (GET). ",
        "ADMIN/SELLER yuborsa e'tiborsiz qoldiriladi.",
        '',
        "**Rate limiting:** sign-in/OTP/parol tiklash — 3 so'rov/daqiqa (IP + telefon); ",
        'autentifikatsiyalangan foydalanuvchi — 120/daqiqa, anonim — 30/daqiqa (IP). ',
        '429 javobida `Retry-After` header qaytariladi.',
        '',
        '**Javob formati:** muvaffaqiyat — `{ statusCode, data }`; ',
        'xato — `{ statusCode, message, code, data }`. Frontend mantiqini ',
        "barqaror `code` qiymatiga bog'lang, `message` faqat ko'rsatish uchun.",
        '',
        "**Ro'yxatlar:** barcha ro'yxat endpointlari bir xil shaklda qaytaradi — ",
        '`{ items: [...], meta: { total, page, limit, totalPages } }`. ',
        "`page` (standart 1) va `limit` (standart 20, ko'pi bilan 100) query parametrlari.",
        '',
        '**Telefon raqamlar** barcha javoblarda E.164 formatida: `+998901234567`. ',
        'Kirishda `998901234567` yoki `901234567` ham qabul qilinadi va shu formatga keltiriladi.',
        '',
        '**Qurilma limiti:** har bir FOYDALANUVCHI uchun `DEVICE_LIMIT_PER_USER` (standart 3). ',
        "Limit to'lganda `DEVICE_LIMIT_REACHED` va `data.devices` ro'yxati qaytadi.",
      ].join('\n'),
    )
    .setVersion('1.0')
    .addCookieAuth('accessToken', {
      type: 'apiKey',
      in: 'cookie',
      name: 'accessToken',
      description: "Sign-in oqimida avtomatik o'rnatiladigan httpOnly cookie",
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
  // Barcha endpointlar (@Public bo'lganlaridan tashqari) cookie auth talab qiladi
  document.security = [{ accessToken: [] }];
  return document;
}
