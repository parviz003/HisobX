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
import { ErrorCode } from '../errors/error-codes';

/**
 * Loyihadagi yagona xato formati:
 *
 * ```json
 * { "statusCode": 409, "message": "...", "code": "MACHINE_CODE", "data": { } }
 * ```
 *
 * Frontend mantiqini `code` ga bog'laydi, `message` faqat ko'rsatish uchun.
 */
@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: string = ErrorCode.INTERNAL_SERVER_ERROR;
    let message = 'Ichki xatolik yuz berdi';
    let data: unknown;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      code = HttpStatus[statusCode] ?? 'HTTP_ERROR';
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      }

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const body = exceptionResponse as {
          error?: string;
          code?: string;
          message?: string | string[];
          data?: unknown;
          /** eskicha nom — orqaga moslik uchun o'qiladi */
          details?: unknown;
        };

        /*
         * `code` faqat SCREAMING_SNAKE_CASE bo'ladi: frontend unga mantiq
         * bog'laydi. Nest'ning standart `error` maydoni ("Unauthorized",
         * "Not Found") inson uchun matn — uni kod sifatida ishlatmaymiz;
         * status nomi (UNAUTHORIZED, NOT_FOUND) aniqroq va barqarorroq.
         */
        code = body.code ?? code;

        if (typeof body.message === 'string') {
          message = body.message;
        } else if (Array.isArray(body.message)) {
          message = body.message.join(', ');
        }

        data = body.data ?? body.details;
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
          code = ErrorCode.CONFLICT;
          message = "Bunday ma'lumot allaqachon mavjud";
          data = { fields: exception.meta?.target };
          break;
        case 'P2025':
          statusCode = HttpStatus.NOT_FOUND;
          code = ErrorCode.NOT_FOUND;
          message = "Ma'lumot topilmadi";
          break;
        case 'P2003':
          statusCode = HttpStatus.BAD_REQUEST;
          code = ErrorCode.VALIDATION_ERROR;
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
      code = ErrorCode.VALIDATION_ERROR;
      message = "So'rov ma'lumotlari noto'g'ri";
    }

    const errorStack =
      exception instanceof Error ? exception.stack : JSON.stringify(exception);

    this.logger.error(
      `${request.method} ${request.url} -> ${statusCode} ${code} ${message}`,
      errorStack,
    );

    if (statusCode >= 500) {
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
      const retryAfter = (data as { retryAfter?: number })?.retryAfter;
      if (retryAfter && !response.getHeader('Retry-After')) {
        response.setHeader('Retry-After', String(Math.ceil(retryAfter)));
      }
    }

    response.status(statusCode).json({
      statusCode,
      message,
      code,
      data: data ?? null,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
