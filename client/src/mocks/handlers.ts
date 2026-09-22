import { http, HttpResponse } from 'msw';
import { authHandlers, telegramLinkHandler } from './auth-handlers';

/**
 * Backend'da HALI YO'Q endpoint'lar uchun mock javoblar (topshiriq 5.2).
 * `VITE_USE_MOCKS=true` bo'lganda faqat shu yo'llar mock'dan olinadi,
 * qolgan hamma so'rov haqiqiy backend'ga o'tadi (onUnhandledRequest: 'bypass').
 *
 * Har bir handler keyingi bosqichlarda to'ldiriladi.
 */
const BASE = '/api/v1';

/** Backend javob formati: { statusCode, data }. */
function ok<T>(data: T, statusCode = 200) {
  return HttpResponse.json({ statusCode, data }, { status: statusCode });
}

/**
 * `VITE_MOCK_AUTH=true` bo'lsa, to'liq kirish oqimi ham mock'lanadi
 * (ikkala Telegram oqimi va 4 rolni backendsiz sinash uchun).
 */
const useAuthMocks = import.meta.env.VITE_MOCK_AUTH === 'true';

export const handlers = [
  // TODO(backend) 5.2-3: Telegram ulanish holatini tekshirish
  telegramLinkHandler,

  ...(useAuthMocks ? authHandlers : []),

  // TODO(backend) 5.2-7: mijozni Telegramga ulash
  http.post(`${BASE}/customers/:id/telegram-link`, () =>
    ok({
      linkToken: 'mock-customer-token',
      botUrl: 'https://t.me/hisobx_bot?start=mock-customer-token',
      expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
    }),
  ),

  // TODO(backend) 5.2-7: qarz eslatmasini qo'lda yuborish
  http.post(`${BASE}/customers/:id/remind`, () => ok({ sent: true })),

  // TODO(backend) 5.2-8: eslatmalar jadvali
  http.get(`${BASE}/stores/me/reminder-settings`, () =>
    ok({ enabled: true, daysBefore: [3, 1], onDueDate: true, overdueEveryDays: 7 }),
  ),
  http.patch(`${BASE}/stores/me/reminder-settings`, async ({ request }) =>
    ok(await request.json()),
  ),

  // TODO(backend) 5.2-9: dashboard va grafiklar
  http.get(`${BASE}/reports/dashboard`, () =>
    ok({
      todaySales: 0,
      todaySalesCount: 0,
      todayNetProfit: 0,
      cashBalance: 0,
      totalDebt: 0,
      overdueDebt: 0,
      overdueCount: 0,
      lowStockCount: 0,
      monthExpenses: 0,
      monthNetProfit: 0,
      comparison: { salesVsYesterdayPct: 0, profitVsLastMonthPct: 0 },
    }),
  ),
  http.get(`${BASE}/reports/sales-chart`, () => ok([])),
  http.get(`${BASE}/reports/top-products`, () => ok([])),
  http.get(`${BASE}/reports/seller-today`, () => ok({ salesCount: 0, salesTotal: 0 })),
];
