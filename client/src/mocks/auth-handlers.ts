import { http, HttpResponse } from 'msw';

/**
 * To'liq kirish oqimini backendsiz sinash uchun mock'lar.
 *
 * Bular FAQAT `VITE_USE_MOCKS=true` VA `VITE_MOCK_AUTH=true` bo'lgandagina
 * yoqiladi. Standart holatda (`VITE_MOCK_AUTH` yo'q) auth so'rovlari haqiqiy
 * backend'ga ketadi — topshiriqdagi "faqat 5.2 endpoint'lari mock'dan" qoidasi
 * buzilmaydi.
 *
 * Telefon raqamiga qarab turli oqim va rollar sinaladi:
 *   +998 90 000 00 01 → Telegram ULANMAGAN (ulanish ekrani)
 *   +998 90 000 00 11 → MANAGER      +998 90 000 00 12 → ADMIN
 *   +998 90 000 00 13 → SELLER       +998 90 000 00 14 → SUPERADMIN
 *   boshqa raqamlar   → MANAGER
 * Tasdiqlash kodi har doim: 111111
 */
const BASE = '/api/v1';

export const MOCK_OTP_CODE = '111111';
const NOT_LINKED_PHONE = '+998900000001';

const ROLE_BY_PHONE: Record<string, string> = {
  '+998900000011': 'MANAGER',
  '+998900000012': 'ADMIN',
  '+998900000013': 'SELLER',
  '+998900000014': 'SUPERADMIN',
};

function ok<T>(data: T, statusCode = 200) {
  return HttpResponse.json({ statusCode, data }, { status: statusCode });
}

function fail(status: number, message: string, extra: Record<string, unknown> = {}) {
  return HttpResponse.json({ statusCode: status, message, ...extra }, { status });
}

function iso(msFromNow: number) {
  return new Date(Date.now() + msFromNow).toISOString();
}

function otpPayload() {
  return {
    telegramLinked: true,
    expiresAt: iso(60_000),
    resendAvailableAt: iso(60_000),
    windowExpiresAt: iso(10 * 60_000),
    code: MOCK_OTP_CODE,
  };
}

/** Mock sessiya holati (faqat brauzer xotirasida). */
const session = { phone: null as string | null, signedIn: false, linkLinked: false };

/** Telegram ulanish mock'i: 3-so'rovdan keyin "ulandi" deb javob beradi. */
let linkPolls = 0;
const telegramLinkHandler = http.get(`${BASE}/auth/telegram-link-status`, () => {
  linkPolls += 1;
  if (linkPolls < 3) return ok({ linked: false });
  session.linkLinked = true;
  linkPolls = 0;
  return ok({
    linked: true,
    expiresAt: iso(60_000),
    resendAvailableAt: iso(60_000),
  });
});

export const authHandlers = [
  http.post(`${BASE}/auth/signin`, async ({ request }) => {
    const body = (await request.json()) as { phone?: string; password?: string };
    const phone = body.phone ?? '';
    session.phone = phone;

    if (!body.password) return fail(400, 'Telefon raqam yoki parol xato');

    if (phone === NOT_LINKED_PHONE && !session.linkLinked) {
      return ok({
        telegramLinked: false,
        linkToken: 'mock-link-token',
        botUrl: 'https://t.me/hisobx_bot?start=mock-link-token',
        linkExpiresAt: iso(10 * 60_000),
      });
    }

    return ok(otpPayload());
  }),

  http.post(`${BASE}/auth/resend-otp`, () => ok(otpPayload())),

  http.post(`${BASE}/auth/confirm`, async ({ request }) => {
    const body = (await request.json()) as { phone?: string; code?: string };
    if (body.code !== MOCK_OTP_CODE) return fail(400, 'Kod xato');
    session.phone = body.phone ?? session.phone;
    session.signedIn = true;
    return ok({ success: true });
  }),

  http.post(`${BASE}/auth/forgot-password`, () => ok(otpPayload())),

  http.post(`${BASE}/auth/reset-password`, async ({ request }) => {
    const body = (await request.json()) as { code?: string };
    if (body.code !== MOCK_OTP_CODE) return fail(400, 'Kod xato');
    return ok({ success: true });
  }),

  http.post(`${BASE}/auth/refresh`, () =>
    session.signedIn ? ok({ success: true }) : fail(401, 'Unauthorized'),
  ),

  http.post(`${BASE}/auth/signout`, () => {
    session.signedIn = false;
    session.phone = null;
    return ok({ success: true });
  }),

  http.get(`${BASE}/users/me`, () => {
    if (!session.signedIn) return fail(401, 'Unauthorized');
    const phone = session.phone ?? '';
    const role = ROLE_BY_PHONE[phone] ?? 'MANAGER';
    // Shakl haqiqiy `GET /users/me` javobiga mos.
    return ok({
      id: 1,
      fullName: 'Sinov foydalanuvchi',
      name: null,
      phone,
      role,
      status: 'ACTIVE',
      isActive: true,
      imageUrl: null,
      storeId: role === 'SUPERADMIN' ? null : 1,
      store: role === 'SUPERADMIN' ? null : { id: 1, name: "Sinov do'koni" },
      telegramLinked: phone !== NOT_LINKED_PHONE || session.linkLinked,
    });
  }),

  // Shakl haqiqiy `GET /device` javobiga mos: { deviceId, device, createdAt }.
  http.get(`${BASE}/device`, () =>
    ok([
      {
        deviceId: 1,
        device: 'Chrome Mobile Device',
        createdAt: iso(-3 * 24 * 60 * 60_000),
      },
      {
        deviceId: 2,
        device: 'Firefox Desktop Device',
        createdAt: iso(-10 * 24 * 60 * 60_000),
      },
    ]),
  ),

  http.delete(`${BASE}/device/:id`, () => ok({ success: true })),

  http.get(`${BASE}/auth/qr-status`, ({ request }) => {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    if (!token) return ok({ status: 'invalid' });
    return ok({ status: 'pending' });
  }),

  // Backendsiz sinashda ulanish oqimi ham to'liq ishlashi uchun
  telegramLinkHandler,
];
