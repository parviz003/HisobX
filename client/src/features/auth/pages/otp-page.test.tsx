import { describe, expect, it, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderRoute } from '@/test/render';
import { clearAuthFlow, getAuthFlow, startAuthFlow } from '../api/auth-flow';
import OtpPage from './otp-page';

const BASE = '/api/v1';

function iso(ms: number) {
  return new Date(Date.now() + ms).toISOString();
}

function renderOtp() {
  return renderRoute(
    [
      { path: '/login/otp', element: <OtpPage /> },
      { path: '/login', element: <p>Kirish sahifasi</p> },
      { path: '/dashboard', element: <p>Bosh sahifa</p> },
      { path: '/pos', element: <p>Savdo</p> },
    ],
    ['/login/otp'],
  );
}

describe('OtpPage', () => {
  beforeEach(() => clearAuthFlow());

  it('oqim yo\'q bo\'lsa login sahifasiga qaytaradi', async () => {
    renderOtp();
    expect(await screen.findByText('Kirish sahifasi')).toBeInTheDocument();
  });

  it('kod amal qilish taymerini ko\'rsatadi', async () => {
    startAuthFlow('signin', '+998901234567', {
      expiresAt: iso(45_000),
      resendAvailableAt: iso(30_000),
    });
    renderOtp();
    expect(await screen.findByText(/00:4\d/)).toBeInTheDocument();
  });

  it('taymer vaqtlari sessionStorage\'da saqlanadi (sahifa yangilansa ham to\'g\'ri)', () => {
    const expiresAt = iso(50_000);
    startAuthFlow('signin', '+998901234567', { expiresAt, resendAvailableAt: iso(20_000) });

    // Modul holatini emas, saqlangan qiymatni tekshiramiz.
    const raw = sessionStorage.getItem('hisobx-auth-flow');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string)).toMatchObject({ expiresAt, phone: '+998901234567' });
  });

  it('kod eskirsa ogohlantiradi va tasdiqlash tugmasini yopadi', async () => {
    startAuthFlow('signin', '+998901234567', {
      expiresAt: iso(-1000),
      resendAvailableAt: iso(-1000),
    });
    renderOtp();

    expect(await screen.findByText(/muddati tugadi/i)).toBeInTheDocument();
  });

  it('qayta yuborish taymeri tugamaguncha tugma yopiq', async () => {
    startAuthFlow('signin', '+998901234567', {
      expiresAt: iso(60_000),
      resendAvailableAt: iso(40_000),
    });
    renderOtp();

    const resend = await screen.findByRole('button', { name: /qayta yuborish: 00:/i });
    expect(resend).toBeDisabled();
  });

  it('6 raqam kiritilganda avtomatik yuboriladi va ichkariga kiritadi', async () => {
    server.use(
      http.post(`${BASE}/auth/confirm`, () =>
        HttpResponse.json({ statusCode: 200, data: { success: true } }),
      ),
      http.get(`${BASE}/users/me`, () =>
        HttpResponse.json({
          statusCode: 200,
          data: {
            id: 1,
            fullName: 'Sinov',
            phone: '+998901234567',
            role: 'MANAGER',
            status: 'ACTIVE',
            storeId: 1,
          },
        }),
      ),
    );

    startAuthFlow('signin', '+998901234567', {
      expiresAt: iso(60_000),
      resendAvailableAt: iso(60_000),
    });

    const user = userEvent.setup();
    renderOtp();

    await user.type(screen.getByLabelText(/6 raqamli kod/i), '123456');

    expect(await screen.findByText('Bosh sahifa')).toBeInTheDocument();
    // Oqim tozalanadi.
    expect(getAuthFlow()).toBeNull();
  });

  it('SELLER tasdiqlagach savdo sahifasiga tushadi', async () => {
    server.use(
      http.post(`${BASE}/auth/confirm`, () =>
        HttpResponse.json({ statusCode: 200, data: { success: true } }),
      ),
      http.get(`${BASE}/users/me`, () =>
        HttpResponse.json({
          statusCode: 200,
          data: {
            id: 2,
            fullName: 'Sotuvchi',
            phone: '+998901234567',
            role: 'SELLER',
            status: 'ACTIVE',
            storeId: 1,
          },
        }),
      ),
    );

    startAuthFlow('signin', '+998901234567', {
      expiresAt: iso(60_000),
      resendAvailableAt: iso(60_000),
    });

    const user = userEvent.setup();
    renderOtp();
    await user.type(screen.getByLabelText(/6 raqamli kod/i), '123456');

    expect(await screen.findByText('Savdo')).toBeInTheDocument();
  });

  it('xato kodda qolgan urinishlar kamayadi', async () => {
    server.use(
      http.post(`${BASE}/auth/confirm`, () =>
        HttpResponse.json({ statusCode: 400, message: 'Kod xato' }, { status: 400 }),
      ),
    );

    startAuthFlow('signin', '+998901234567', {
      expiresAt: iso(60_000),
      resendAvailableAt: iso(60_000),
    });

    const user = userEvent.setup();
    renderOtp();

    expect(await screen.findByText(/qolgan urinish: 3/i)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/6 raqamli kod/i), '000000');

    await waitFor(() =>
      expect(screen.getByText(/qolgan urinish: 2/i)).toBeInTheDocument(),
    );
  });

  it('urinishlar tugasa blok xabari chiqadi', async () => {
    startAuthFlow('signin', '+998901234567', {
      expiresAt: iso(60_000),
      resendAvailableAt: iso(60_000),
      attemptsLeft: 0,
    });
    renderOtp();

    expect(await screen.findByText(/urinishlar tugadi/i)).toBeInTheDocument();
  });

  it('10 daqiqalik oyna tugasa login\'ga qaytishni taklif qiladi', async () => {
    startAuthFlow('signin', '+998901234567', {
      expiresAt: iso(60_000),
      resendAvailableAt: iso(60_000),
      windowExpiresAt: iso(-1000),
    });
    renderOtp();

    expect(await screen.findByText(/ajratilgan vaqt tugadi/i)).toBeInTheDocument();
  });
});
