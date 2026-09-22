import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ErrorResponseDto } from './error-response.dto';

type SuccessOptions = {
  /** HTTP status (standart: 200) */
  status?: number;
  description?: string;
  /** `data` massiv bo'lsa */
  isArray?: boolean;
};

/**
 * Muvaffaqiyatli javobni loyihaning `{ statusCode, data }` o'ramiga soladi.
 *
 * ```ts
 * @ApiSuccess(UserResponseDto, { description: "Profil ma'lumotlari" })
 * ```
 */
export const ApiSuccess = <TModel extends Type<unknown>>(
  model: TModel,
  options: SuccessOptions = {},
) => {
  const { status = 200, description, isArray = false } = options;
  const dataSchema = isArray
    ? { type: 'array', items: { $ref: getSchemaPath(model) } }
    : { $ref: getSchemaPath(model) };

  return applyDecorators(
    ApiExtraModels(model),
    ApiResponse({
      status,
      description,
      schema: {
        type: 'object',
        required: ['statusCode', 'data'],
        properties: {
          statusCode: { type: 'integer', example: status },
          data: dataSchema,
        },
      },
    }),
  );
};

/** `data` oddiy qiymat (masalan, `{ message: string }`) bo'lmagan hollar uchun */
export const ApiSuccessRaw = (
  schema: Record<string, unknown>,
  options: Omit<SuccessOptions, 'isArray'> = {},
) => {
  const { status = 200, description } = options;
  return ApiResponse({
    status,
    description,
    schema: {
      type: 'object',
      required: ['statusCode', 'data'],
      properties: {
        statusCode: { type: 'integer', example: status },
        data: schema,
      },
    },
  });
};

/**
 * Xato javobi: status, barqaror `code` va (bo'lsa) `data` shakli bilan.
 *
 * ```ts
 * @ApiError(403, 'DEVICE_LIMIT_REACHED', 'Qurilmalar limiti to‘ldi')
 * ```
 */
export const ApiError = (
  status: number,
  code: string | string[],
  description?: string,
  dataSchema?: Record<string, unknown>,
) => {
  const codes = Array.isArray(code) ? code : [code];
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiResponse({
      status,
      description: description
        ? `${description} (code: ${codes.join(' | ')})`
        : `code: ${codes.join(' | ')}`,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ErrorResponseDto) },
          {
            type: 'object',
            properties: {
              statusCode: { type: 'integer', example: status },
              code: { type: 'string', enum: codes, example: codes[0] },
              ...(dataSchema ? { data: dataSchema } : {}),
            },
          },
        ],
      },
    }),
  );
};

/** Har bir himoyalangan endpoint uchun umumiy xatolar */
export const ApiAuthErrors = () =>
  applyDecorators(
    ApiError(401, ['UNAUTHORIZED', 'SESSION_EXPIRED'], 'Sessiya yaroqsiz'),
    ApiError(403, 'FORBIDDEN', 'Ruxsat yetarli emas'),
  );

/** So'rov tanasi/parametrlari validatsiyadan o'tmaganda */
export const ApiValidationError = () =>
  ApiError(400, 'VALIDATION_ERROR', "So'rov ma'lumotlari noto'g'ri", {
    type: 'object',
    properties: {
      fields: {
        type: 'array',
        items: { type: 'string' },
        example: ['phone noto‘g‘ri formatda'],
      },
    },
  });
