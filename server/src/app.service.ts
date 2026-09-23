import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { env } from './config';
import express from 'express';
import { join } from 'path';
import helmet from 'helmet';
import { SwaggerModule } from '@nestjs/swagger';
import {
  API_PREFIX,
  applyGlobalSetup,
  createSwaggerDocument,
} from './app.setup';

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

    app.use(
      `${API_PREFIX}/uploads`,
      express.static(join(process.cwd(), env.FILE_PATH)),
    );

    app.use(helmet());

    /*
     * CORS: barcha IP-manzillar va domenlardan kirishga ruxsat berish.
     * origin: true (so'rov yuborgan origin'ni dinamik aks ettiradi) va credentials: true
     * har qanday IP-manzil (lokal tarmoq, mobil, domenlar) bilan to'liq xatosiz ishlashini ta'minlaydi.
     * (Eslatma: credentials: true bo'lganda origin: '*' yozilsa, brauzerlar xavfsizlik sababli bloklaydi).
     */
    app.enableCors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Accept',
        'Authorization',
        'x-store-id',
        'X-Requested-With',
        'Origin',
      ],
      exposedHeaders: ['Retry-After', 'Set-Cookie'],
    });

    // Pipe'lar, filtr, cookie-parser va prefiks — e2e testlar bilan bir manbadan
    applyGlobalSetup(app);

    // Swagger UI: {prefix}/docs, JSON: {prefix}/docs-json
    SwaggerModule.setup(
      `${API_PREFIX}/docs`,
      app,
      () => createSwaggerDocument(app),
      { swaggerOptions: { persistAuthorization: true } },
    );

    await app.listen(PORT, () =>
      console.log('HisobX Server running on port', PORT),
    );
  }
}
