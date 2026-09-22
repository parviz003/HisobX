import { api } from '@/lib/api/client';
import type {
  CurrentUser,
  Device,
  SignInResponse,
  TelegramLinkStatus,
} from './types';

/**
 * Auth endpoint'lari ustidagi yupqa qatlam.
 *
 * orval generatsiyasi javob tiplarini bilmaydi (Swagger'da response sxemalari
 * yo'q), shuning uchun bu yerda kutilgan tiplar aniq ko'rsatilgan.
 * Kontrakt to'ldirilgach generatsiya qilingan hooklarga o'tiladi.
 */
export const authApi = {
  signIn: async (phone: string, password: string): Promise<SignInResponse> => {
    const { data } = await api.post<SignInResponse>('/auth/signin', { phone, password });
    return data;
  },

  /** Muvaffaqiyatli bo'lsa backend cookie'larni o'rnatadi. */
  confirm: async (phone: string, code: string): Promise<void> => {
    await api.post('/auth/confirm', { phone, code });
  },

  resendOtp: async (phone: string): Promise<SignInResponse> => {
    const { data } = await api.post<SignInResponse>('/auth/resend-otp', { phone });
    return data;
  },

  /** Javob raqam mavjudligini oshkor qilmaydi. */
  forgotPassword: async (phone: string): Promise<SignInResponse> => {
    const { data } = await api.post<SignInResponse>('/auth/forgot-password', { phone });
    return data;
  },

  resetPassword: async (phone: string, code: string, password: string): Promise<void> => {
    await api.post('/auth/reset-password', { phone, code, password });
  },

  signOut: async (): Promise<void> => {
    await api.post('/auth/signout');
  },

  me: async (signal?: AbortSignal): Promise<CurrentUser> => {
    const { data } = await api.get<CurrentUser>('/users/me', { signal });
    return data;
  },

  devices: async (signal?: AbortSignal): Promise<Device[]> => {
    const { data } = await api.get<Device[]>('/device', { signal });
    return data;
  },

  removeDevice: async (id: number): Promise<void> => {
    await api.delete(`/device/${id}`);
  },

  /** TODO(backend) 5.2-3: hozircha faqat MSW mock'ida. */
  telegramLinkStatus: async (
    token: string,
    signal?: AbortSignal,
  ): Promise<TelegramLinkStatus> => {
    const { data } = await api.get<TelegramLinkStatus>('/auth/telegram-link-status', {
      params: { token },
      signal,
    });
    return data;
  },
};
