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
} from '../support/auth';
import { TelegramBotService } from '../../src/modules/telegram/telegram-bot.service';
import type { TelegramUpdate } from '../../src/infrastructure/lib/TelegramApi';

/**
 * Blok B: Telegram orqali OTP va hisobni ulash oqimi.
 *
 * Haqiqiy Telegramga so'rov ketmaydi (token bo'sh) — bot xizmatiga
 * yangilanishlar to'g'ridan-to'g'ri uzatiladi, xuddi polling olib kelgandek.
 */
describe('B — Telegram ulash va OTP (e2e)', () => {
  let ctx: TestContext;
  let bot: TelegramBotService;
  let storeId: number;
  let user: SeededUser;

  /** Har testda boshqa chat — bitta chat bitta hisobga bog'lanadi */
  let chatId = 500000000;

  beforeAll(async () => {
    ctx = await createTestApp();
    bot = ctx.app.get(TelegramBotService);
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await resetDatabase(ctx.db);
    await resetRedis(ctx.redis);

    const store = await seedStore(ctx);
    storeId = store.id;
    // Ataylab ULANMAGAN hisob — aynan shu oqim sinaladi
    user = await seedUser(ctx, {
      role: Role.ADMIN,
      storeId,
      telegramLinked: false,
    });
    chatId += 1;
  });

  /* ------------------------------ Ulanmagan hisob ---------------------------- */

  it('ulanmagan hisobda sign-in kod emas, ulash havolasini qaytaradi', async () => {
    const res = await signIn().expect(200);

    expect(res.body.data.telegramLinked).toBe(false);
    expect(res.body.data.linkToken).toEqual(expect.any(String));
    expect(res.body.data.botUrl).toContain(res.body.data.linkToken as string);
    expect(res.body.data.linkExpiresAt).toEqual(expect.any(String));
    // Kod YUBORILMAYDI — hisob hali botga ulanmagan
    expect(res.body.data.code).toBeUndefined();
  });

  it('ulanmagunicha link-status `linked: false` qaytaradi', async () => {
    const { linkToken } = await startLink();
    const res = await linkStatus(linkToken).expect(200);
    expect(res.body.data).toEqual({ linked: false });
  });

  /* -------------------------------- To'liq oqim ------------------------------ */

  it("/start + o'z kontakti hisobni ulaydi va kod yuboriladi", async () => {
    const { linkToken } = await startLink();

    await bot.handle(startUpdate(linkToken));
    await bot.handle(contactUpdate({ phone: user.phone }));

    const linked = await ctx.db.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(linked.telegramChatId).toBe(String(chatId));
    expect(linked.telegramLinkedAt).not.toBeNull();

    const status = await linkStatus(linkToken).expect(200);
    expect(status.body.data.linked).toBe(true);
    expect(status.body.data.expiresAt).toEqual(expect.any(String));
    expect(status.body.data.resendAvailableAt).toEqual(expect.any(String));
  });

  it('ulangandan keyin sign-in kod qaytaradi va kirish yakunlanadi', async () => {
    await linkAccount();
    // Ulanishda kod yuborilgan — testda cooldown'ni kutib o'tirmaymiz
    await clearOtpCooldown(ctx, user.phone);

    const res = await signIn().expect(200);
    expect(res.body.data.telegramLinked).toBe(true);

    const code = res.body.data.code as string;
    expect(code).toEqual(expect.any(String));

    await ctx
      .http()
      .post(`${API}/auth/confirm`)
      .send({ phone: user.phone, code })
      .expect(200);
  });

  it("/users/me da telegramLinked ko'rinadi, chat IDsi esa yo'q", async () => {
    await linkAccount();
    await clearOtpCooldown(ctx, user.phone);

    const signinRes = await signIn().expect(200);
    const confirmRes = await ctx
      .http()
      .post(`${API}/auth/confirm`)
      .send({ phone: user.phone, code: signinRes.body.data.code })
      .expect(200);

    const cookies = (
      confirmRes.headers['set-cookie'] as unknown as string[]
    ).map((cookie) => cookie.split(';')[0]);

    const me = await ctx
      .http()
      .get(`${API}/users/me`)
      .set('Cookie', cookies)
      .expect(200);

    expect(me.body.data.telegramLinked).toBe(true);
    expect(me.body.data).not.toHaveProperty('telegramChatId');
  });

  /* --------------------------------- Rad etish ------------------------------- */

  it('BEGONA kontakt rad etiladi (contact.user_id != from.id)', async () => {
    const { linkToken } = await startLink();
    await bot.handle(startUpdate(linkToken));

    await bot.handle(
      contactUpdate({ phone: user.phone, contactUserId: chatId + 777 }),
    );

    await expectNotLinked();
  });

  it('boshqa raqamli kontakt rad etiladi', async () => {
    const { linkToken } = await startLink();
    await bot.handle(startUpdate(linkToken));

    await bot.handle(contactUpdate({ phone: '+998901112233' }));

    await expectNotLinked();
  });

  it('eskirgan (yoki mavjud bo‘lmagan) token bilan ulanmaydi', async () => {
    await bot.handle(startUpdate('yaroqsiz-token'));
    await bot.handle(contactUpdate({ phone: user.phone }));

    await expectNotLinked();
    const res = await linkStatus('yaroqsiz-token').expect(200);
    expect(res.body.data).toEqual({ linked: false });
  });

  it('token muddati tugasa ulanmaydi', async () => {
    const { linkToken } = await startLink();
    await bot.handle(startUpdate(linkToken));

    // Muddat tugashini taqlid qilamiz
    await ctx.redis.client.del(`tg:link:${linkToken}`);

    await bot.handle(contactUpdate({ phone: user.phone }));
    await expectNotLinked();
  });

  it('token bir martalik — ikkinchi marta ishlamaydi', async () => {
    const { linkToken } = await linkAccount();

    const other = await seedUser(ctx, {
      role: Role.SELLER,
      storeId,
      telegramLinked: false,
    });
    chatId += 1;

    await bot.handle(startUpdate(linkToken));
    await bot.handle(contactUpdate({ phone: other.phone }));

    const notLinked = await ctx.db.user.findUniqueOrThrow({
      where: { id: other.id },
    });
    expect(notLinked.telegramChatId).toBeNull();
  });

  /* ------------------------- Dev zaxira yo'li (bot yo'q) --------------------- */

  it("bot sozlanmaganda dev zaxira yo'li ulashni talab qilmaydi", async () => {
    const { env } = await import('../../src/config');
    const original = env.TELEGRAM.DEV_FALLBACK;
    env.TELEGRAM.DEV_FALLBACK = true;

    try {
      const res = await signIn().expect(200);
      // Bot yo'q — localhost'da kirish to'silmaydi, kod odatdagidek beriladi
      expect(res.body.data.telegramLinked).toBe(true);
      expect(res.body.data.code).toEqual(expect.any(String));
    } finally {
      env.TELEGRAM.DEV_FALLBACK = original;
    }
  });

  /* ---------------------------- Parolni tiklash oqimi ------------------------ */

  it('forgot-password javobi raqam mavjudligini oshkor qilmaydi', async () => {
    const known = await forgotPassword(user.phone).expect(200);
    const unknown = await forgotPassword('+998909998877').expect(200);

    expect(known.body.data.message).toBe(unknown.body.data.message);
  });

  /* ------------------------------ yordamchilar ------------------------------ */

  function signIn() {
    return ctx
      .http()
      .post(`${API}/auth/signin`)
      .send({ phone: user.phone, password: user.password });
  }

  function linkStatus(token: string) {
    return ctx.http().get(`${API}/auth/telegram-link-status?token=${token}`);
  }

  function forgotPassword(phone: string) {
    return ctx.http().post(`${API}/auth/forgot-password`).send({ phone });
  }

  async function startLink(): Promise<{ linkToken: string }> {
    const res = await signIn().expect(200);
    return { linkToken: res.body.data.linkToken as string };
  }

  /** To'liq ulash: sign-in -> /start -> kontakt */
  async function linkAccount(): Promise<{ linkToken: string }> {
    const { linkToken } = await startLink();
    await bot.handle(startUpdate(linkToken));
    await bot.handle(contactUpdate({ phone: user.phone }));
    return { linkToken };
  }

  async function expectNotLinked() {
    const fresh = await ctx.db.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(fresh.telegramChatId).toBeNull();
  }

  let updateId = 0;
  function startUpdate(token: string): TelegramUpdate {
    updateId += 1;
    return {
      update_id: updateId,
      message: {
        message_id: updateId,
        from: { id: chatId },
        chat: { id: chatId, type: 'private' },
        text: `/start ${token}`,
      },
    };
  }

  function contactUpdate(input: {
    phone: string;
    contactUserId?: number;
  }): TelegramUpdate {
    updateId += 1;
    return {
      update_id: updateId,
      message: {
        message_id: updateId,
        from: { id: chatId },
        chat: { id: chatId, type: 'private' },
        contact: {
          phone_number: input.phone,
          user_id: input.contactUserId ?? chatId,
        },
      },
    };
  }
});
