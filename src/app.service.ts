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

    app.enableCors({ origin: true, credentials: true });

    app.setGlobalPrefix(url);

    const config = new DocumentBuilder()
      .setTitle('HisobX Mini Store Management SaaS API')
      .setDescription('Marketplace-style modular monolith API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${url}/docs`, app, documentFactory);

    await app.listen(PORT, () =>
      console.log('HisobX Server running on port', PORT),
    );
  }
}
