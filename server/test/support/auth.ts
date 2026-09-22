import { Role } from '@prisma/client';
import { API, TestContext } from './app';
import { Crypt } from '../../src/infrastructure/lib/Crypt';
import { Phone } from '../../src/common/helper/phone';

export interface SeededUser {
  id: number;
  phone: string;
  password: string;
  role: Role;
  storeId: number | null;
}

export interface Session extends SeededUser {
  /** `Cookie` headeri uchun tayyor qiymat */
  cookies: string[];
  deviceId: number;
}

let phoneCounter = 0;

/** Har chaqiruvda yangi, takrorlanmas test raqami: `+99890xxxxxxx` */
export function nextPhone(): string {
  phoneCounter += 1;
  return `+99890${String(1000000 + phoneCounter).slice(-7)}`;
}

export async function seedStore(ctx: TestContext, name = "Test Do'kon") {
  return ctx.db.store.create({ data: { name } });
}

export async function seedUser(
  ctx: TestContext,
  options: {
    role: Role;
    storeId?: number | null;
    phone?: string;
    password?: string;
    fullName?: string;
  },
): Promise<SeededUser> {
  const phone = options.phone ?? nextPhone();
  const password = options.password ?? 'Password123!';
  const user = await ctx.db.user.create({
    data: {
      phone,
      password: await Crypt.hash(password),
      role: options.role,
      fullName: options.fullName ?? 'Test Foydalanuvchi',
      storeId: options.storeId ?? null,
    },
  });
  return {
    id: user.id,
    phone,
    password,
    role: user.role,
    storeId: user.storeId,
  };
}

/**
 * To'liq kirish oqimi: `signin` -> OTP -> `confirm`.
 * Natijada `Cookie` headeri uchun tayyor qiymatlar qaytadi.
 */
export async function signIn(
  ctx: TestContext,
  user: SeededUser,
  userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
): Promise<Session> {
  // Ketma-ket kirishlar OTP cooldown'iga tiqilib qolmasligi uchun
  await clearOtpCooldown(ctx, user.phone);

  const signinRes = await ctx
    .http()
    .post(`${API}/auth/signin`)
    .set('User-Agent', userAgent)
    .send({ phone: user.phone, password: user.password })
    .expect(200);

  const code = signinRes.body.data.code as string;
  if (!code) {
    throw new Error('OTP kodi javobda yo‘q (NODE_ENV=development kerak)');
  }

  const confirmRes = await ctx
    .http()
    .post(`${API}/auth/confirm`)
    .set('User-Agent', userAgent)
    .send({ phone: user.phone, code })
    .expect(200);

  const cookies = extractCookies(confirmRes);
  return {
    ...user,
    cookies,
    deviceId: confirmRes.body.data.deviceId as number,
  };
}

/** `set-cookie` headeridan `name=value` juftliklarini ajratadi */
export function extractCookies(res: {
  headers: Record<string, any>;
}): string[] {
  const raw = res.headers['set-cookie'];
  const list: string[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return list.map((cookie) => cookie.split(';')[0]);
}

/** Faqat access cookie (refresh yuborilmaydigan holatlarni sinash uchun) */
export function onlyAccess(cookies: string[]): string[] {
  return cookies.filter((c) => c.startsWith('accessToken='));
}

/**
 * OTP qayta yuborish cooldown'ini bekor qiladi.
 * Testlar bir foydalanuvchi nomidan ketma-ket bir necha marta kiradi,
 * cooldown esa real oqimda foydali, testlarda esa shunchaki to'sqinlik.
 */
export async function clearOtpCooldown(
  ctx: TestContext,
  phone: string,
  purpose: 'signin' | 'reset' = 'signin',
) {
  const digits = Phone.digits(phone);
  await ctx.redis.client.del(`otp:${purpose}:resend:${digits}`);
}
