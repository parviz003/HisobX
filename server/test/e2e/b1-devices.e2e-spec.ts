import { Role } from '@prisma/client';
import {
  API,
  TestContext,
  createTestApp,
  resetDatabase,
  resetRedis,
} from '../support/app';
import {
  SeededUser,
  clearOtpCooldown,
  seedStore,
  seedUser,
  signIn,
} from '../support/auth';

const CHROME_WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const SAFARI_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const FIREFOX_LINUX =
  'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0';
const EDGE_WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';

/** B1: qurilmalar ro'yxati, limit va o'chirish qoidalari */
describe('B1 — Qurilmalar (e2e)', () => {
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

  describe('GET /device javob shakli', () => {
    it('barcha kelishilgan maydonlarni qaytaradi', async () => {
      const session = await signIn(ctx, user, CHROME_WINDOWS);

      const res = await ctx
        .http()
        .get(`${API}/device`)
        .set('Cookie', session.cookies)
        .expect(200);

      expect(res.body.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(1);

      const device = res.body.data[0];
      expect(Object.keys(device).sort()).toEqual(
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
      expect(device.browser).toBe('Chrome');
      expect(device.os).toBe('Windows');
      expect(device.isCurrent).toBe(true);
      expect(typeof device.canRemoveAt).toBe('string');
    });

    it('isCurrent faqat so‘rov yuborgan qurilmada true', async () => {
      await signIn(ctx, user, CHROME_WINDOWS);
      const second = await signIn(ctx, user, SAFARI_IPHONE);

      const res = await ctx
        .http()
        .get(`${API}/device`)
        .set('Cookie', second.cookies)
        .expect(200);

      const current = res.body.data.filter((d: any) => d.isCurrent);
      expect(current).toHaveLength(1);
      expect(current[0].deviceId).toBe(second.deviceId);
    });

    it('lastActiveAt har refreshda yangilanadi', async () => {
      const session = await signIn(ctx, user, CHROME_WINDOWS);

      const before = await ctx
        .http()
        .get(`${API}/device`)
        .set('Cookie', session.cookies)
        .expect(200);
      const firstSeen = new Date(before.body.data[0].lastActiveAt).getTime();

      await new Promise((resolve) => setTimeout(resolve, 1100));

      const refreshed = await ctx
        .http()
        .post(`${API}/auth/refresh`)
        .set('Cookie', session.cookies)
        .expect(200);
      const rotated = (
        refreshed.headers['set-cookie'] as unknown as string[]
      ).map((c) => c.split(';')[0]);

      const after = await ctx
        .http()
        .get(`${API}/device`)
        .set('Cookie', rotated)
        .expect(200);
      const secondSeen = new Date(after.body.data[0].lastActiveAt).getTime();

      expect(secondSeen).toBeGreaterThan(firstSeen);
    });

    it("qurilma ro'yxati faqat o'z hisobiga tegishli", async () => {
      const other = await seedUser(ctx, { role: Role.SELLER, storeId });
      await signIn(ctx, other, FIREFOX_LINUX);
      const session = await signIn(ctx, user, CHROME_WINDOWS);

      const res = await ctx
        .http()
        .get(`${API}/device`)
        .set('Cookie', session.cookies)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].deviceId).toBe(session.deviceId);
    });
  });

  describe('Qurilma limiti (DEVICE_LIMIT_PER_USER)', () => {
    it('4-qurilmada DEVICE_LIMIT_REACHED va data.devices qaytadi', async () => {
      await signIn(ctx, user, CHROME_WINDOWS);
      await signIn(ctx, user, SAFARI_IPHONE);
      await signIn(ctx, user, FIREFOX_LINUX);

      await clearOtpCooldown(ctx, user.phone);
      const signinRes = await ctx
        .http()
        .post(`${API}/auth/signin`)
        .set('User-Agent', EDGE_WINDOWS)
        .send({ phone: user.phone, password: user.password })
        .expect(200);

      const res = await ctx
        .http()
        .post(`${API}/auth/confirm`)
        .set('User-Agent', EDGE_WINDOWS)
        .send({ phone: user.phone, code: signinRes.body.data.code })
        .expect(403);

      expect(res.body.code).toBe('DEVICE_LIMIT_REACHED');
      expect(res.body.data.limit).toBe(3);
      expect(res.body.data.devices).toHaveLength(3);

      for (const device of res.body.data.devices) {
        expect(device).toHaveProperty('deviceId');
        expect(device).toHaveProperty('device');
        expect(device).toHaveProperty('browser');
        expect(device).toHaveProperty('os');
        expect(device).toHaveProperty('deviceType');
        expect(device).toHaveProperty('ip');
        expect(device).toHaveProperty('createdAt');
        expect(device).toHaveProperty('lastActiveAt');
        expect(device).toHaveProperty('canRemoveAt');
        // Kirmagan foydalanuvchi uchun joriy qurilma yo'q
        expect(device.isCurrent).toBe(false);
      }
    });

    it("limit HAR BIR FOYDALANUVCHI uchun: boshqa xodim ta'sirlanmaydi", async () => {
      await signIn(ctx, user, CHROME_WINDOWS);
      await signIn(ctx, user, SAFARI_IPHONE);
      await signIn(ctx, user, FIREFOX_LINUX);

      // Xuddi shu do'kondagi boshqa xodim bemalol kira oladi
      const seller = await seedUser(ctx, { role: Role.SELLER, storeId });
      const sellerSession = await signIn(ctx, seller, CHROME_WINDOWS);
      expect(sellerSession.deviceId).toBeDefined();
    });

    it('bir xil qurilmadan qayta kirish yangi sessiya ochmaydi', async () => {
      const first = await signIn(ctx, user, CHROME_WINDOWS);
      const second = await signIn(ctx, user, CHROME_WINDOWS);

      expect(second.deviceId).toBe(first.deviceId);

      const res = await ctx
        .http()
        .get(`${API}/device`)
        .set('Cookie', second.cookies)
        .expect(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('DELETE /device/:id', () => {
    it("24 soat to'lmagan qurilma uchun DEVICE_REMOVAL_TOO_EARLY va canRemoveAt", async () => {
      const session = await signIn(ctx, user, CHROME_WINDOWS);
      const other = await signIn(ctx, user, SAFARI_IPHONE);

      const res = await ctx
        .http()
        .delete(`${API}/device/${other.deviceId}`)
        .set('Cookie', session.cookies)
        .expect(400);

      expect(res.body.code).toBe('DEVICE_REMOVAL_TOO_EARLY');
      expect(typeof res.body.data.canRemoveAt).toBe('string');
      expect(new Date(res.body.data.canRemoveAt).getTime()).toBeGreaterThan(
        Date.now(),
      );
    });

    it("24 soatdan eski qurilma o'chiriladi", async () => {
      const session = await signIn(ctx, user, CHROME_WINDOWS);
      const other = await signIn(ctx, user, SAFARI_IPHONE);

      // Qurilmani "eskirtiramiz"
      await ctx.db.devices.update({
        where: { deviceId: other.deviceId },
        data: { createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000) },
      });

      const res = await ctx
        .http()
        .delete(`${API}/device/${other.deviceId}`)
        .set('Cookie', session.cookies)
        .expect(200);

      expect(res.body.data.deviceId).toBe(other.deviceId);

      const left = await ctx.db.devices.count({ where: { userId: user.id } });
      expect(left).toBe(1);
    });

    it("joriy qurilmani o'chirib bo'lmaydi", async () => {
      const session = await signIn(ctx, user, CHROME_WINDOWS);

      const res = await ctx
        .http()
        .delete(`${API}/device/${session.deviceId}`)
        .set('Cookie', session.cookies)
        .expect(400);

      expect(res.body.code).toBe('DEVICE_CURRENT_CANNOT_BE_REMOVED');
    });

    it("boshqa foydalanuvchining qurilmasini o'chirib bo'lmaydi", async () => {
      const victim = await seedUser(ctx, { role: Role.SELLER, storeId });
      const victimSession = await signIn(ctx, victim, FIREFOX_LINUX);
      await ctx.db.devices.update({
        where: { deviceId: victimSession.deviceId },
        data: { createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000) },
      });

      const attacker = await signIn(ctx, user, CHROME_WINDOWS);

      const res = await ctx
        .http()
        .delete(`${API}/device/${victimSession.deviceId}`)
        .set('Cookie', attacker.cookies)
        .expect(404);

      expect(res.body.code).toBe('DEVICE_NOT_FOUND');

      const stillThere = await ctx.db.devices.count({
        where: { deviceId: victimSession.deviceId },
      });
      expect(stillThere).toBe(1);
    });
  });
});
