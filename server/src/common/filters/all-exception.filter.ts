import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { LoggerBot } from '../bot/logger-bot';

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal server error';
    let details: unknown;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      code = HttpStatus[statusCode] ?? 'HTTP_ERROR';
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      }

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const data = exceptionResponse as {
          error?: string;
          code?: string;
          message?: string | string[];
          details?: unknown;
        };

        code = data.code ?? data.error ?? code;

        if (typeof data.message === 'string') {
          message = data.message;
        } else if (Array.isArray(data.message)) {
          message = data.message.join(', ');
        }

        details = data.details;
      }
    }

    // Prisma xatoliklari tushunarli HTTP statuslarga o'giriladi
    if (
      !(exception instanceof HttpException) &&
      exception instanceof Prisma.PrismaClientKnownRequestError
    ) {
      switch (exception.code) {
        case 'P2002':
          statusCode = HttpStatus.CONFLICT;
          code = 'CONFLICT';
          message = "Bunday ma'lumot allaqachon mavjud";
          details = exception.meta?.target;
          break;
        case 'P2025':
          statusCode = HttpStatus.NOT_FOUND;
          code = 'NOT_FOUND';
          message = "Ma'lumot topilmadi";
          break;
        case 'P2003':
          statusCode = HttpStatus.BAD_REQUEST;
          code = 'BAD_REQUEST';
          message = "Bog'liq ma'lumot noto'g'ri yoki mavjud emas";
          break;
        default:
          break;
      }
    }

    if (
      !(exception instanceof HttpException) &&
      exception instanceof Prisma.PrismaClientValidationError
    ) {
      statusCode = HttpStatus.BAD_REQUEST;
      code = 'BAD_REQUEST';
      message = "So'rov ma'lumotlari noto'g'ri";
    }

    const errorStack =
      exception instanceof Error ? exception.stack : JSON.stringify(exception);

    this.logger.error(
      `${request.method} ${request.url} -> ${statusCode} ${message}`,
      errorStack,
    );

    if (statusCode === 400 || statusCode === 500) {
      const telegramMessage = `
🚨 <b>HisobX Xatolik:</b>
<b>Status:</b> ${statusCode}
<b>Code:</b> ${code}
<b>Method:</b> ${request.method}
<b>URL:</b> ${request.url}
<b>Xabar:</b> ${message}
<b>Vaqt:</b> ${new Date().toISOString()}
      `.trim();
      LoggerBot.sendMessage(telegramMessage).catch(() => {});
    }

    // 429 javoblarida standart Retry-After header (OTP cooldown va boshqalar uchun)
    if (statusCode === HttpStatus.TOO_MANY_REQUESTS) {
      const retryAfter = (details as { retryAfter?: number })?.retryAfter;
      if (retryAfter && !response.getHeader('Retry-After')) {
        response.setHeader('Retry-After', String(Math.ceil(retryAfter)));
      }
    }

    response.status(statusCode).json({
      statusCode,
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
