import { Role } from '@prisma/client';
import {
  API,
  TestContext,
  createTestApp,
  resetDatabase,
  resetRedis,
} from '../support/app';
import { SeededUser, seedStore, seedUser, signIn } from '../support/auth';
import { Crypt } from '../../src/infrastructure/lib/Crypt';

const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0';
const SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Version/17.0 Mobile Safari/604.1';
const FIREFOX = 'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Firefox/121.0';

/** B1: profil xavfsizligi — telefon/parol PATCH /users/me dan olib tashlandi */
describe('B1 — Profil va parol (e2e)', () => {
  let ctx: TestContext;
  let user: SeededUser;
  let storeId: number;

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
    storeId = store.id;
    user = await seedUser(ctx, { role: Role.ADMIN, storeId });
  });

  describe('PATCH /users/me', () => {
    it('fullName yangilanadi', async () => {
      const session = await signIn(ctx, user);

      const res = await ctx
        .http()
        .patch(`${API}/users/me`)
        .set('Cookie', session.cookies)
        .send({ fullName: 'Yangi Ism' })
        .expect(200);

      expect(res.body.data.fullName).toBe('Yangi Ism');
    });

    it('phone yuborilsa 400 (VALIDATION_ERROR) — maydon qabul qilinmaydi', async () => {
      const session = await signIn(ctx, user);

      const res = await ctx
        .http()
        .patch(`${API}/users/me`)
        .set('Cookie', session.cookies)
        .send({ fullName: 'Ism', phone: '+998909998877' })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');

      const unchanged = await ctx.db.user.findUnique({
        where: { id: user.id },
      });
      expect(unchanged?.phone).toBe(user.phone);
    });

    it('password yuborilsa 400 (VALIDATION_ERROR) — maydon qabul qilinmaydi', async () => {
      const session = await signIn(ctx, user);

      const res = await ctx
        .http()
        .patch(`${API}/users/me`)
        .set('Cookie', session.cookies)
        .send({ password: 'HackedPassword1!' })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');

      const unchanged = await ctx.db.user.findUnique({
        where: { id: user.id },
      });
      const stillOld = await Crypt.compare(user.password, unchanged!.password);
      expect(stillOld).toBe(true);
    });
  });

  describe('PATCH /users/me/password', () => {
    it("noto'g'ri joriy parolda WRONG_PASSWORD", async () => {
      const session = await signIn(ctx, user);

      const res = await ctx
        .http()
        .patch(`${API}/users/me/password`)
        .set('Cookie', session.cookies)
        .send({ currentPassword: 'Wrong123!', newPassword: 'NewPass123!' })
        .expect(400);

      expect(res.body.code).toBe('WRONG_PASSWORD');

      const unchanged = await ctx.db.user.findUnique({
        where: { id: user.id },
      });
      expect(await Crypt.compare(user.password, unchanged!.password)).toBe(
        true,
      );
    });

    it('parol yangilanadi va yangi parol bilan kirish mumkin', async () => {
      const session = await signIn(ctx, user);

      await ctx
        .http()
        .patch(`${API}/users/me/password`)
        .set('Cookie', session.cookies)
        .send({
          currentPassword: user.password,
          newPassword: 'BrandNewPass1!',
        })
        .expect(200);

      await signIn(ctx, { ...user, password: 'BrandNewPass1!' }, FIREFOX);
    });

    it('joriy qurilmadan tashqari barcha sessiyalar bekor qilinadi', async () => {
      const current = await signIn(ctx, user, CHROME);
      const other = await signIn(ctx, user, SAFARI);

      // Ikkala sessiya ham ishlayapti
      await ctx
        .http()
        .get(`${API}/users/me`)
        .set('Cookie', other.cookies)
        .expect(200);

      const res = await ctx
        .http()
        .patch(`${API}/users/me/password`)
        .set('Cookie', current.cookies)
        .send({
          currentPassword: user.password,
          newPassword: 'BrandNewPass1!',
        })
        .expect(200);

      expect(res.body.data.revokedSessions).toBe(1);

      // Joriy qurilma ishlashda davom etadi
      await ctx
        .http()
        .get(`${API}/users/me`)
        .set('Cookie', current.cookies)
        .expect(200);

      // Boshqa qurilma chiqarib yuborilgan
      await ctx
        .http()
        .get(`${API}/users/me`)
        .set('Cookie', other.cookies)
        .expect(401);

      const left = await ctx.db.devices.findMany({
        where: { userId: user.id },
      });
      expect(left).toHaveLength(1);
      expect(left[0].deviceId).toBe(current.deviceId);
    });

    it('qisqa yangi parol rad etiladi', async () => {
      const session = await signIn(ctx, user);

      const res = await ctx
        .http()
        .patch(`${API}/users/me/password`)
        .set('Cookie', session.cookies)
        .send({ currentPassword: user.password, newPassword: '123' })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('autentifikatsiyasiz 401', async () => {
      await ctx
        .http()
        .patch(`${API}/users/me/password`)
        .send({ currentPassword: 'a', newPassword: 'bbbbbb' })
        .expect(401);
    });
  });

  describe('Regressiya: multi-tenant himoya', () => {
    it("x-store-id ADMIN uchun e'tiborsiz qoldiriladi", async () => {
      const otherStore = await seedStore(ctx, "Begona Do'kon");
      const session = await signIn(ctx, user);

      const res = await ctx
        .http()
        .get(`${API}/stores/me`)
        .set('Cookie', session.cookies)
        .set('x-store-id', String(otherStore.id))
        .expect(200);

      expect(res.body.data.id).toBe(storeId);
    });

    it('SUPERADMIN x-store-id bilan yozish amalini bajara olmaydi', async () => {
      const superadmin = await ctx.db.user.findFirst({
        where: { role: Role.SUPERADMIN },
      });
      // Parolni testda bilamiz deb hisoblab, yangisini o'rnatamiz
      await ctx.db.user.update({
        where: { id: superadmin!.id },
        data: { password: await Crypt.hash('SuperPass123!') },
      });
      const session = await signIn(
        ctx,
        {
          id: superadmin!.id,
          phone: superadmin!.phone,
          password: 'SuperPass123!',
          role: Role.SUPERADMIN,
          storeId: null,
        },
        CHROME,
      );

      const res = await ctx
        .http()
        .patch(`${API}/stores/${storeId}`)
        .set('Cookie', session.cookies)
        .set('x-store-id', String(storeId))
        .send({ name: 'Yangi nom' })
        .expect(403);

      expect(res.body.statusCode).toBe(403);
    });
  });
});
