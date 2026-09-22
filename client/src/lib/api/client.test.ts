import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { api } from './client';
import { isApiError } from './errors';
import { onSessionEvent } from './session';

const BASE = '/api/v1';

describe('API klient — javobni ochish', () => {
  it("{ statusCode, data } dan `data` ni ajratib beradi", async () => {
    server.use(
      http.get(`${BASE}/thing`, () =>
        HttpResponse.json({ statusCode: 200, data: { id: 7, name: 'Non' } }),
      ),
    );

    const response = await api.get<{ id: number; name: string }>('/thing');
    expect(response.data).toEqual({ id: 7, name: 'Non' });
  });

  it("o'rami bo'lmagan javobni o'zgartirmaydi", async () => {
    server.use(http.get(`${BASE}/plain`, () => HttpResponse.json([1, 2, 3])));
    const response = await api.get<number[]>('/plain');
    expect(response.data).toEqual([1, 2, 3]);
  });
});

describe('API klient — 401 va refresh', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => server.resetHandlers());

  it('401 dan keyin refresh qilib so\'rovni qayta yuboradi', async () => {
    let protectedCalls = 0;
    let refreshCalls = 0;

    server.use(
      http.get(`${BASE}/secure`, () => {
        protectedCalls += 1;
        if (protectedCalls === 1) return new HttpResponse(null, { status: 401 });
        return HttpResponse.json({ statusCode: 200, data: { ok: true } });
      }),
      http.post(`${BASE}/auth/refresh`, () => {
        refreshCalls += 1;
        return HttpResponse.json({ statusCode: 200, data: null });
      }),
    );

    const response = await api.get<{ ok: boolean }>('/secure');

    expect(response.data).toEqual({ ok: true });
    expect(refreshCalls).toBe(1);
    expect(protectedCalls).toBe(2);
  });

  it('parallel 401 so\'rovlar uchun refresh FAQAT BIR MARTA chaqiriladi', async () => {
    const calls: Record<string, number> = { a: 0, b: 0, c: 0, refresh: 0 };

    const makeRoute = (key: 'a' | 'b' | 'c') =>
      http.get(`${BASE}/p-${key}`, () => {
        calls[key] += 1;
        if (calls[key] === 1) return new HttpResponse(null, { status: 401 });
        return HttpResponse.json({ statusCode: 200, data: key });
      });

    server.use(
      makeRoute('a'),
      makeRoute('b'),
      makeRoute('c'),
      http.post(`${BASE}/auth/refresh`, async () => {
        calls.refresh += 1;
        // Sekin refresh: parallel so'rovlar navbatda kutishi kerak.
        await new Promise((resolve) => setTimeout(resolve, 30));
        return HttpResponse.json({ statusCode: 200, data: null });
      }),
    );

    const results = await Promise.all([
      api.get<string>('/p-a'),
      api.get<string>('/p-b'),
      api.get<string>('/p-c'),
    ]);

    expect(results.map((r) => r.data)).toEqual(['a', 'b', 'c']);
    expect(calls.refresh).toBe(1);
  });

  it('refresh ham 401 bersa sessiya tugaydi va hodisa e\'lon qilinadi', async () => {
    const seen: string[] = [];
    const unsubscribe = onSessionEvent((event) => seen.push(event.reason));

    server.use(
      http.get(`${BASE}/secure2`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${BASE}/auth/refresh`, () => new HttpResponse(null, { status: 401 })),
    );

    await expect(api.get('/secure2')).rejects.toMatchObject({ status: 401 });
    expect(seen).toContain('expired');

    unsubscribe();
  });

  it('/auth/refresh ning o\'zi 401 bersa qayta urinmaydi (aylanma yo\'q)', async () => {
    let refreshCalls = 0;
    server.use(
      http.post(`${BASE}/auth/refresh`, () => {
        refreshCalls += 1;
        return new HttpResponse(null, { status: 401 });
      }),
    );

    await expect(api.post('/auth/refresh')).rejects.toMatchObject({ status: 401 });
    expect(refreshCalls).toBe(1);
  });

  it('signin 401 bersa refresh urinilmaydi', async () => {
    let refreshCalls = 0;
    server.use(
      http.post(`${BASE}/auth/signin`, () => new HttpResponse(null, { status: 401 })),
      http.post(`${BASE}/auth/refresh`, () => {
        refreshCalls += 1;
        return HttpResponse.json({ statusCode: 200, data: null });
      }),
    );

    await expect(api.post('/auth/signin', {})).rejects.toMatchObject({ status: 401 });
    expect(refreshCalls).toBe(0);
  });
});

describe('API klient — xatolar', () => {
  it('429 da Retry-After sekundlarga aylanadi', async () => {
    server.use(
      http.get(`${BASE}/limited`, () =>
        new HttpResponse(null, { status: 429, headers: { 'Retry-After': '45' } }),
      ),
    );

    await expect(api.get('/limited')).rejects.toMatchObject({
      status: 429,
      retryAfter: 45,
      message: 'errors.tooManyRequests',
    });
  });

  it('400 da maydon xatolari ajratiladi', async () => {
    server.use(
      http.post(`${BASE}/form`, () =>
        HttpResponse.json(
          { statusCode: 400, message: ['phone must be a valid phone number'] },
          { status: 400 },
        ),
      ),
    );

    try {
      await api.post('/form', {});
      expect.unreachable('xato kutilgan edi');
    } catch (error) {
      expect(isApiError(error)).toBe(true);
      if (isApiError(error)) {
        expect(error.status).toBe(400);
        expect(error.fieldErrors?.phone).toContain('phone');
      }
    }
  });

  it('500 da texnik tafsilot ko\'rsatilmaydi', async () => {
    server.use(
      http.get(`${BASE}/boom`, () =>
        HttpResponse.json({ statusCode: 500, message: 'PrismaClientKnownRequestError' }, { status: 500 }),
      ),
    );

    await expect(api.get('/boom')).rejects.toMatchObject({
      status: 500,
      message: 'errors.generic',
    });
  });

  it('403 da tushunarli kalit qaytadi', async () => {
    server.use(http.get(`${BASE}/nope`, () => new HttpResponse(null, { status: 403 })));
    await expect(api.get('/nope')).rejects.toMatchObject({
      status: 403,
      message: 'errors.forbidden',
    });
  });
});
