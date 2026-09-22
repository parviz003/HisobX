import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { env } from './config';
import express from 'express';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all-exception.filter';
import cookieParser from 'cookie-parser';

export class App {
  static async main() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // Proxy/balanser ortida haqiqiy mijoz IP'si (rate limiting va loglar uchun)
    const trustProxy = Number.isNaN(Number(env.TRUST_PROXY))
      ? env.TRUST_PROXY
      : Number(env.TRUST_PROXY);
    if (trustProxy !== 0) {
      app.set('trust proxy', trustProxy);
    }
    const PORT = env.PORT;
    const url = '/api/v1';

    app.use(
      `${url}/uploads`,
      express.static(join(process.cwd(), env.FILE_PATH)),
    );

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    app.useGlobalFilters(new AllExceptionsFilter());

    app.use(helmet());

    app.use(cookieParser());

    /*
     * CORS faqat .env dagi aniq origin(lar)ga ochiladi (CORS_ORIGINS).
     * Ro'yxat bo'sh bo'lsa, cross-origin so'rovlar rad etiladi.
     */
    app.enableCors({
      origin: env.CORS_ORIGINS.length ? env.CORS_ORIGINS : false,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'x-store-id'],
      exposedHeaders: ['Retry-After'],
    });

    app.setGlobalPrefix(url);

    const config = new DocumentBuilder()
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
      .build();

    const documentFactory = () => SwaggerModule.createDocument(app, config);
    // Swagger UI: {url}/docs, JSON: {url}/docs-json
    SwaggerModule.setup(`${url}/docs`, app, documentFactory, {
      swaggerOptions: { persistAuthorization: true },
    });

    await app.listen(PORT, () =>
      console.log('HisobX Server running on port', PORT),
    );
  }
}
