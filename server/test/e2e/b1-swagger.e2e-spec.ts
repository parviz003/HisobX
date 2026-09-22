import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';
import { API, TestContext, createTestApp } from '../support/app';
import { ErrorResponseDto } from '../../src/common/swagger';

/**
 * B1: Swagger frontend uchun yagona kontrakt manbai.
 * Bu testlar hujjat kod bilan bir xilligini kafolatlaydi.
 */
describe('B1 — Swagger kontrakti (e2e)', () => {
  let ctx: TestContext;
  let doc: OpenAPIObject;

  beforeAll(async () => {
    ctx = await createTestApp();
    const config = new DocumentBuilder()
      .setTitle('HisobX')
      .setVersion('1.0')
      .addCookieAuth('accessToken', {
        type: 'apiKey',
        in: 'cookie',
        name: 'accessToken',
      })
      .build();
    doc = SwaggerModule.createDocument(ctx.app, config, {
      extraModels: [ErrorResponseDto],
    });
  });

  afterAll(async () => {
    await ctx.close();
  });

  /** Hujjatdagi barcha (yo'l, metod, operatsiya) uchliklari */
  const operations = (document: OpenAPIObject) =>
    Object.entries(document.paths).flatMap(([path, item]) =>
      Object.entries(item as Record<string, any>)
        .filter(([method]) =>
          ['get', 'post', 'patch', 'put', 'delete'].includes(method),
        )
        .map(([method, operation]) => ({ path, method, operation })),
    );

  it('har bir endpoint muvaffaqiyat javobi sxemasiga ega', () => {
    const missing = operations(doc)
      .filter(({ operation }) => {
        const codes = Object.keys(operation.responses ?? {});
        const success = codes.filter((c) => c.startsWith('2'));
        return (
          success.length === 0 ||
          !success.some(
            (c) =>
              operation.responses[c]?.content?.['application/json']?.schema,
          )
        );
      })
      .map(({ method, path }) => `${method.toUpperCase()} ${path}`);

    expect(missing).toEqual([]);
  });

  it("muvaffaqiyat javoblari { statusCode, data } o'ramida", () => {
    const wrong: string[] = [];

    for (const { path, method, operation } of operations(doc)) {
      for (const [code, response] of Object.entries<any>(
        operation.responses ?? {},
      )) {
        if (!code.startsWith('2')) continue;
        const schema = response?.content?.['application/json']?.schema;
        if (!schema) continue;
        const props = schema.properties ?? {};
        if (!props.statusCode || !props.data) {
          wrong.push(`${method.toUpperCase()} ${path} -> ${code}`);
        }
      }
    }

    expect(wrong).toEqual([]);
  });

  it('xato javoblari ErrorResponseDto sxemasiga tayanadi', () => {
    expect(doc.components?.schemas?.ErrorResponseDto).toBeDefined();
    const schema: any = doc.components!.schemas!.ErrorResponseDto;
    expect(Object.keys(schema.properties)).toEqual(
      expect.arrayContaining(['statusCode', 'message', 'code', 'data']),
    );
  });

  it('kalit biznes xatolari hujjatlangan (code bilan)', () => {
    const confirm = JSON.stringify(
      doc.paths[`${API}/auth/confirm`].post!.responses,
    );
    expect(confirm).toContain('DEVICE_LIMIT_REACHED');
    expect(confirm).toContain('OTP_INVALID');
    expect(confirm).toContain('OTP_ATTEMPTS_EXCEEDED');
    expect(confirm).toContain('OTP_EXPIRED');

    const deleteDevice = JSON.stringify(
      doc.paths[`${API}/device/{id}`].delete!.responses,
    );
    expect(deleteDevice).toContain('DEVICE_REMOVAL_TOO_EARLY');

    const changePassword = JSON.stringify(
      doc.paths[`${API}/users/me/password`].patch!.responses,
    );
    expect(changePassword).toContain('WRONG_PASSWORD');
  });

  it('DeviceResponseDto kelishilgan maydonlarni saqlaydi', () => {
    const schema: any = doc.components?.schemas?.DeviceResponseDto;
    expect(schema).toBeDefined();
    expect(Object.keys(schema.properties).sort()).toEqual(
      [
        'browser',
        'canRemoveAt',
        'createdAt',
        'device',
        'deviceId',
        'deviceType',
        'ip',
        'isCurrent',
        'lastActiveAt',
        'os',
      ].sort(),
    );
  });

  it("PATCH /users/me da phone va password maydonlari yo'q", () => {
    const schema: any = doc.components?.schemas?.UpdateProfileDto;
    expect(Object.keys(schema.properties)).toEqual(['fullName']);
  });

  it('multipart endpointlar requestBody bilan hujjatlangan', () => {
    const multipart = [
      [`${API}/users/me/image`, 'patch'],
      [`${API}/products`, 'post'],
      [`${API}/products/{id}`, 'patch'],
    ] as const;

    for (const [path, method] of multipart) {
      const operation: any = (doc.paths[path] as any)[method];
      expect(
        operation.requestBody?.content?.['multipart/form-data']?.schema,
      ).toBeDefined();
    }
  });

  it('telefon maydonlari misolda +998 formatida', () => {
    const schemas = JSON.stringify(doc.components?.schemas ?? {});
    // Misollarda "998901234567" ko'rinishi (+ siz) qolmasligi kerak
    expect(schemas).not.toMatch(/"example"\s*:\s*"998\d{9}"/);
  });
});
