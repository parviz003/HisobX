import { Role } from '@prisma/client';
import {
  API,
  TestContext,
  createTestApp,
  resetDatabase,
  resetRedis,
} from '../support/app';
import { SeededUser, seedStore, seedUser, signIn } from '../support/auth';

/**
 * B1: OTP xato kodlari, telefon formati va kirish oqimi.
 */
describe('B1 — Auth va OTP kodlari (e2e)', () => {
  let ctx: TestContext;
  let user: SeededUser;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await resetDatabase(ctx.db);
    await resetRedis(ctx.redis);
    const store = await seedStore(ctx);
    user = await seedUser(ctx, { role: Role.ADMIN, storeId: store.id });
  });

  describe('Telefon formati', () => {
    it('javobda telefon har doim +998... formatida qaytadi', async () => {
      const res = await ctx
        .http()
        .post(`${API}/auth/signin`)
        .send({ phone: user.phone, password: user.password })
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(res.body.data.phone).toMatch(/^\+998\d{9}$/);
      expect(res.body.data.phone).toBe(user.phone);
    });

    it("'+' siz yuborilgan raqam ham qabul qilinadi va normallashtiriladi", async () => {
      const withoutPlus = user.phone.replace('+', '');
      const res = await ctx
        .http()
        .post(`${API}/auth/signin`)
        .send({ phone: withoutPlus, password: user.password })
        .expect(200);

      expect(res.body.data.phone).toBe(user.phone);
    });

    it("bo'shliqli format ham qabul qilinadi", async () => {
      const spaced = user.phone.replace(
        /^(\+998)(\d{2})(\d{3})(\d{2})(\d{2})$/,
        '$1 $2 $3 $4 $5',
      );
      const res = await ctx
        .http()
        .post(`${API}/auth/signin`)
        .send({ phone: spaced, password: user.password })
        .expect(200);

      expect(res.body.data.phone).toBe(user.phone);
    });

    it('GET /users/me javobida ham +998 formati', async () => {
      const session = await signIn(ctx, user);
      const res = await ctx
        .http()
        .get(`${API}/users/me`)
        .set('Cookie', session.cookies)
        .expect(200);

      expect(res.body.data.phone).toBe(user.phone);
      expect(res.body.data.phone).toMatch(/^\+998\d{9}$/);
    });
  });

  describe('Xato formati', () => {
    it('xato javobi { statusCode, message, code, data } shaklida', async () => {
      const res = await ctx
        .http()
        .post(`${API}/auth/signin`)
        .send({ phone: user.phone, password: 'NotTheRightOne!' })
        .expect(400);

      expect(res.body).toMatchObject({
        statusCode: 400,
        code: 'INVALID_CREDENTIALS',
      });
      expect(typeof res.body.message).toBe('string');
      expect(res.body).toHaveProperty('data');
    });

    it('kodlar har doim SCREAMING_SNAKE_CASE (Nest matnlari emas)', async () => {
      // Autentifikatsiyasiz so'rov -> AuthGuard'ning standart 401'i
      const unauthorized = await ctx.http().get(`${API}/users/me`).expect(401);
      expect(unauthorized.body.code).toBe('UNAUTHORIZED');
      expect(unauthorized.body.code).toMatch(/^[A-Z][A-Z0-9_]*$/);

      const session = await signIn(ctx, user);
      const notFound = await ctx
        .http()
        .get(`${API}/users/999999`)
        .set('Cookie', session.cookies)
        .expect(404);
      expect(notFound.body.code).toBe('NOT_FOUND');
    });

    it('validatsiya xatosi VALIDATION_ERROR kodi bilan qaytadi', async () => {
      const res = await ctx
        .http()
        .post(`${API}/auth/signin`)
        .send({ phone: 'salom', password: 'x' })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(Array.isArray(res.body.data.fields)).toBe(true);
      expect(res.body.data.fields.length).toBeGreaterThan(0);
    });
  });

  describe('OTP kodlari', () => {
    it("noto'g'ri kod -> OTP_INVALID va data.attemptsLeft kamayadi", async () => {
      await ctx
        .http()
        .post(`${API}/auth/signin`)
        .send({ phone: user.phone, password: user.password })
        .expect(200);

      const first = await ctx
        .http()
        .post(`${API}/auth/confirm`)
        .send({ phone: user.phone, code: '000000' })
        .expect(400);

      expect(first.body.code).toBe('OTP_INVALID');
      expect(first.body.data.attemptsLeft).toBe(2);

      const second = await ctx
        .http()
        .post(`${API}/auth/confirm`)
        .send({ phone: user.phone, code: '000001' })
        .expect(400);

      expect(second.body.code).toBe('OTP_INVALID');
      expect(second.body.data.attemptsLeft).toBe(1);
    });

    it('urinishlar tugaganda OTP_ATTEMPTS_EXCEEDED (429)', async () => {
      await ctx
        .http()
        .post(`${API}/auth/signin`)
        .send({ phone: user.phone, password: user.password })
        .expect(200);

      await ctx
        .http()
        .post(`${API}/auth/confirm`)
        .send({ phone: user.phone, code: '000000' })
        .expect(400);
      await ctx
        .http()
        .post(`${API}/auth/confirm`)
        .send({ phone: user.phone, code: '000001' })
        .expect(400);

      const third = await ctx
        .http()
        .post(`${API}/auth/confirm`)
        .send({ phone: user.phone, code: '000002' })
        .expect(429);

      expect(third.body.code).toBe('OTP_ATTEMPTS_EXCEEDED');
    });

    it('kod mavjud bo‘lmaganda OTP_EXPIRED', async () => {
      const res = await ctx
        .http()
        .post(`${API}/auth/confirm`)
        .send({ phone: user.phone, code: '123456' })
        .expect(400);

      expect(res.body.code).toBe('OTP_EXPIRED');
    });

    it("to'g'ri kod bilan kirish: cookie o'rnatiladi, token body'da yo'q", async () => {
      const signinRes = await ctx
        .http()
        .post(`${API}/auth/signin`)
        .send({ phone: user.phone, password: user.password })
        .expect(200);

      const confirmRes = await ctx
        .http()
        .post(`${API}/auth/confirm`)
        .send({ phone: user.phone, code: signinRes.body.data.code })
        .expect(200);

      const cookies = confirmRes.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c) => c.startsWith('accessToken='))).toBe(true);
      expect(cookies.some((c) => c.startsWith('refreshToken='))).toBe(true);
      expect(cookies.every((c) => c.includes('HttpOnly'))).toBe(true);

      expect(confirmRes.body.data).not.toHaveProperty('accessToken');
      expect(confirmRes.body.data).not.toHaveProperty('refreshToken');
      expect(confirmRes.body.data.phone).toBe(user.phone);
    });
  });

  describe('Regressiya: mavjud xavfsizlik qoidalari', () => {
    it('parolsiz OTP tasdiqlab bo‘lmaydi (pending belgisi majburiy)', async () => {
      // signin qilinmagan — OTP ham yo'q
      const res = await ctx
        .http()
        .post(`${API}/auth/confirm`)
        .send({ phone: user.phone, code: '123456' })
        .expect(400);

      expect(res.body.code).toBe('OTP_EXPIRED');
    });

    it('bloklangan hisob kira olmaydi (ACCOUNT_INACTIVE)', async () => {
      await ctx.db.user.update({
        where: { id: user.id },
        data: { isActive: false, status: 'INACTIVE' },
      });

      const res = await ctx
        .http()
        .post(`${API}/auth/signin`)
        .send({ phone: user.phone, password: user.password })
        .expect(403);

      expect(res.body.code).toBe('ACCOUNT_INACTIVE');
    });

    it('refresh tokensiz 401 (REFRESH_TOKEN_MISSING)', async () => {
      const res = await ctx.http().post(`${API}/auth/refresh`).expect(401);
      expect(res.body.code).toBe('REFRESH_TOKEN_MISSING');
    });

    it('eski refresh token grace tashqarisida sessiyani bekor qiladi', async () => {
      const session = await signIn(ctx, user);
      const oldCookies = session.cookies;

      // 1-rotatsiya
      const first = await ctx
        .http()
        .post(`${API}/auth/refresh`)
        .set('Cookie', oldCookies)
        .expect(200);
      const rotated = (first.headers['set-cookie'] as unknown as string[]).map(
        (c) => c.split(';')[0],
      );

      // 2-rotatsiya: endi eng eski token hech qayerda saqlanmaydi
      await ctx
        .http()
        .post(`${API}/auth/refresh`)
        .set('Cookie', rotated)
        .expect(200);

      const reused = await ctx
        .http()
        .post(`${API}/auth/refresh`)
        .set('Cookie', oldCookies)
        .expect(401);

      expect(reused.body.code).toBe('SESSION_REVOKED');
    });
  });
});
