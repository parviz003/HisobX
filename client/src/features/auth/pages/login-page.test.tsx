import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { renderRoute } from '@/test/render';
import { clearAuthFlow, getAuthFlow } from '../api/auth-flow';
import LoginPage from './login-page';

const BASE = '/api/v1';

const mockAuth = vi.hoisted(() => ({
  isAuthenticated: false,
  isLoading: false,
  role: null,
}));

vi.mock('../hooks/use-auth', () => ({ useAuth: () => mockAuth }));

function renderLogin() {
  return renderRoute(
    [
      { path: '/login', element: <LoginPage /> },
      { path: '/login/otp', element: <p>OTP ekrani</p> },
      { path: '/login/telegram', element: <p>Telegram ekrani</p> },
      { path: '/login/forgot-password', element: <p>Parolni tiklash</p> },
    ],
    ['/login'],
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    clearAuthFlow();
    mockAuth.isAuthenticated = false;
    mockAuth.isLoading = false;
  });

  it("ro'yxatdan o'tish havolasi YO'Q", () => {
    renderLogin();
    expect(screen.queryByText(/ro'yxatdan/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /signup|register/i })).not.toBeInTheDocument();
  });

  it("parolni unutdingizmi havolasi bor", () => {
    renderLogin();
    expect(screen.getByRole('link', { name: /unutdingizmi/i })).toBeInTheDocument();
  });

  it('telefon to\'liq kiritilmasa xato ko\'rsatadi', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/telefon/i), '90123');
    await user.type(screen.getByLabelText(/^parol$/i), 'parol123');
    await user.click(screen.getByRole('button', { name: /kirish/i }));

    expect(await screen.findByText(/to'liq kiriting/i)).toBeInTheDocument();
  });

  it('parol ko\'rsatish tugmasi maydon turini almashtiradi', async () => {
    const user = userEvent.setup();
    renderLogin();

    const password = screen.getByLabelText(/^parol$/i);
    expect(password).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: /parolni ko'rsatish/i }));
    expect(password).toHaveAttribute('type', 'text');
  });

  it('Telegram ulangan bo\'lsa OTP ekraniga o\'tadi', async () => {
    server.use(
      http.post(`${BASE}/auth/signin`, () =>
        HttpResponse.json({
          statusCode: 200,
          data: {
            telegramLinked: true,
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
            resendAvailableAt: new Date(Date.now() + 60_000).toISOString(),
          },
        }),
      ),
    );

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/telefon/i), '901234567');
    await user.type(screen.getByLabelText(/^parol$/i), 'parol123');
    await user.click(screen.getByRole('button', { name: /kirish/i }));

    expect(await screen.findByText('OTP ekrani')).toBeInTheDocument();
    expect(getAuthFlow()?.phone).toBe('+998901234567');
  });

  it('Telegram ulanmagan bo\'lsa ulanish ekraniga o\'tadi', async () => {
    server.use(
      http.post(`${BASE}/auth/signin`, () =>
        HttpResponse.json({
          statusCode: 200,
          data: {
            telegramLinked: false,
            linkToken: 'tok',
            botUrl: 'https://t.me/bot?start=tok',
            linkExpiresAt: new Date(Date.now() + 600_000).toISOString(),
          },
        }),
      ),
    );

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/telefon/i), '901234567');
    await user.type(screen.getByLabelText(/^parol$/i), 'parol123');
    await user.click(screen.getByRole('button', { name: /kirish/i }));

    expect(await screen.findByText('Telegram ekrani')).toBeInTheDocument();
    expect(getAuthFlow()?.linkToken).toBe('tok');
  });

  it('429 da teskari sanoq ko\'rsatiladi va tugma bloklanadi', async () => {
    server.use(
      http.post(`${BASE}/auth/signin`, () =>
        new HttpResponse(null, { status: 429, headers: { 'Retry-After': '90' } }),
      ),
    );

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/telefon/i), '901234567');
    await user.type(screen.getByLabelText(/^parol$/i), 'parol123');
    await user.click(screen.getByRole('button', { name: /kirish/i }));

    // "01:30" ko'rinishidagi sanoq
    expect(await screen.findByText(/01:3\d/)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /kirish/i })).toBeDisabled(),
    );
  });

  it("noto'g'ri parolda backend xabari ko'rsatiladi", async () => {
    server.use(
      http.post(`${BASE}/auth/signin`, () =>
        HttpResponse.json(
          { statusCode: 400, message: 'Telefon raqam yoki parol xato' },
          { status: 400 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/telefon/i), '901234567');
    await user.type(screen.getByLabelText(/^parol$/i), 'yomonparol');
    await user.click(screen.getByRole('button', { name: /kirish/i }));

    expect(await screen.findByText(/parol xato/i)).toBeInTheDocument();
  });
});
