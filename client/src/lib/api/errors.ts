import { AxiosError } from 'axios';

/** Butun ilova bo'ylab yagona xato tipi. */
export type ApiError = {
  status: number;
  message: string;
  /** Backend 400 da maydon nomlariga bog'langan xatolar (RHF ga uzatiladi). */
  fieldErrors?: Record<string, string>;
  /** 429 da: yana qachon urinish mumkin (soniya). */
  retryAfter?: number;
  /** Backend bergan mashina o'qiydigan kod, bo'lsa. */
  code?: string;
  /**
   * Javobning xom tanasi. Ba'zi xatolar qo'shimcha ma'lumot olib keladi
   * (masalan qurilma limiti to'lganda mavjud qurilmalar ro'yxati), lekin
   * ularning shakli Swagger'da hujjatlashtirilmagan.
   */
  details?: unknown;
};

/** i18n kaliti — xabar UI'da shu kalit orqali tarjima qilinadi. */
export const GENERIC_ERROR_KEY = 'errors.generic';

type BackendErrorBody = {
  statusCode?: number;
  code?: string;
  message?: string | string[];
  errors?: Record<string, string | string[]>;
};

/**
 * NestJS ValidationPipe xabarlari `["field must be ...", ...]` ko'rinishida keladi.
 * Ulardan maydon nomini ajratib olishga harakat qilamiz.
 */
function extractFieldErrors(body: BackendErrorBody): Record<string, string> | undefined {
  const result: Record<string, string> = {};

  if (body.errors && typeof body.errors === 'object') {
    for (const [field, msg] of Object.entries(body.errors)) {
      result[field] = Array.isArray(msg) ? msg[0] : msg;
    }
  }

  if (Array.isArray(body.message)) {
    for (const line of body.message) {
      if (typeof line !== 'string') continue;
      const field = line.split(' ')[0];
      // Faqat ishonchli holatda maydonga bog'laymiz: birinchi so'z identifikatorga o'xshasa.
      if (field && /^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(field) && !result[field]) {
        result[field] = line;
      }
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

function isRecord(value: unknown): value is BackendErrorBody {
  return value !== null && typeof value === 'object';
}

function firstMessage(body: BackendErrorBody): string | undefined {
  if (Array.isArray(body.message)) return body.message.find((m) => typeof m === 'string');
  if (typeof body.message === 'string') return body.message;
  return undefined;
}

export function toApiError(error: unknown): ApiError {
  if (!(error instanceof AxiosError)) {
    return { status: 0, message: GENERIC_ERROR_KEY };
  }

  // Tarmoq uzilgan yoki so'rov bekor qilingan
  if (!error.response) {
    return {
      status: 0,
      message: error.code === 'ERR_CANCELED' ? 'errors.canceled' : 'errors.network',
    };
  }

  const status = error.response.status;
  // axios `data` ni `any` deb beradi — uni avval `unknown` ga bog'lab, keyin
  // kutilgan shaklga keltiramiz (`any` ilovada taqiqlangan).
  const raw: unknown = error.response.data;
  const body: BackendErrorBody = isRecord(raw) ? raw : {};

  if (status === 429) {
    const header: unknown = error.response.headers?.['retry-after'];
    const seconds = Number(header);
    return {
      status,
      message: 'errors.tooManyRequests',
      retryAfter: Number.isFinite(seconds) && seconds > 0 ? seconds : 60,
      code: body.code,
      details: body,
    };
  }

  if (status === 403)
    return { status, message: 'errors.forbidden', code: body.code, details: body };
  if (status === 404)
    return { status, message: 'errors.notFound', code: body.code, details: body };

  // 500+ da texnik tafsilot foydalanuvchiga ko'rsatilmaydi.
  if (status >= 500)
    return { status, message: GENERIC_ERROR_KEY, code: body.code, details: body };

  return {
    status,
    message: firstMessage(body) ?? GENERIC_ERROR_KEY,
    fieldErrors: status === 400 ? extractFieldErrors(body) : undefined,
    code: body.code,
    details: body,
  };
}

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    'message' in value &&
    typeof (value as ApiError).status === 'number'
  );
}
