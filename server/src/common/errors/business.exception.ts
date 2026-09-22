import { HttpException, HttpStatus } from '@nestjs/common';
import type { ErrorCodeValue } from './error-codes';

/**
 * Barqaror `code` va ixtiyoriy `data` bilan biznes xatosi.
 * `AllExceptionsFilter` uni loyihaning yagona xato formatiga o'giradi:
 * `{ statusCode, message, code, data }`.
 */
export class BusinessException extends HttpException {
  constructor(
    status: HttpStatus,
    code: ErrorCodeValue,
    message: string,
    data?: Record<string, unknown>,
  ) {
    super({ statusCode: status, code, message, data }, status);
  }

  static badRequest(
    code: ErrorCodeValue,
    message: string,
    data?: Record<string, unknown>,
  ) {
    return new BusinessException(HttpStatus.BAD_REQUEST, code, message, data);
  }

  static unauthorized(
    code: ErrorCodeValue,
    message: string,
    data?: Record<string, unknown>,
  ) {
    return new BusinessException(HttpStatus.UNAUTHORIZED, code, message, data);
  }

  static forbidden(
    code: ErrorCodeValue,
    message: string,
    data?: Record<string, unknown>,
  ) {
    return new BusinessException(HttpStatus.FORBIDDEN, code, message, data);
  }

  static notFound(
    code: ErrorCodeValue,
    message: string,
    data?: Record<string, unknown>,
  ) {
    return new BusinessException(HttpStatus.NOT_FOUND, code, message, data);
  }

  static conflict(
    code: ErrorCodeValue,
    message: string,
    data?: Record<string, unknown>,
  ) {
    return new BusinessException(HttpStatus.CONFLICT, code, message, data);
  }

  /** 429 — `retryAfter` (sekund) `Retry-After` headeriga ham yoziladi */
  static tooManyRequests(
    code: ErrorCodeValue,
    message: string,
    data?: Record<string, unknown> & { retryAfter?: number },
  ) {
    return new BusinessException(
      HttpStatus.TOO_MANY_REQUESTS,
      code,
      message,
      data,
    );
  }
}
