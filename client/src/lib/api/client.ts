import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { toApiError, type ApiError } from './errors';
import { emitSessionEvent, getImpersonatedStoreId } from './session';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

/** Refresh oqimi bu yo'llarga hech qachon qo'llanmaydi (aylanma bo'lmasligi uchun). */
const AUTH_BYPASS = ['/auth/refresh', '/auth/signout', '/auth/signin', '/auth/confirm'];

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // tokenlar httpOnly cookie'da
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // SUPERADMIN do'konni ko'rish rejimida: faqat GET so'rovlarga do'kon konteksti qo'shiladi.
  const storeId = getImpersonatedStoreId();
  if (storeId !== null && (config.method ?? 'get').toLowerCase() === 'get') {
    config.headers.set('x-store-id', String(storeId));
  }
  return config;
});

/* --------------------------------------------------------------------------
 * 401 → refresh (single-flight)
 * Parallel so'rovlar bitta refresh'ni kutadi, so'ng hammasi qayta yuboriladi.
 * ------------------------------------------------------------------------ */

let refreshPromise: Promise<void> | null = null;

function refreshSession(): Promise<void> {
  refreshPromise ??= api
    .post('/auth/refresh')
    .then(() => undefined)
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

function endSession() {
  emitSessionEvent({ type: 'signed-out', reason: 'expired' });
}

api.interceptors.response.use(
  // Backend har doim `{ statusCode, data }` qaytaradi — `data` ni avtomatik ochamiz.
  (response: AxiosResponse<unknown>) => {
    const body: unknown = response.data;
    if (body !== null && typeof body === 'object' && 'statusCode' in body && 'data' in body) {
      response.data = (body as { data: unknown }).data;
    }
    return response;
  },

  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const url = config?.url ?? '';
    const isAuthRoute = AUTH_BYPASS.some((path) => url.startsWith(path));

    if (status === 401 && config && !config._retried && !isAuthRoute) {
      config._retried = true;
      try {
        await refreshSession();
        return api.request(config);
      } catch {
        // Refresh ham 401 berdi — sessiya tugagan.
        endSession();
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- butun ilova ApiError tipiga tayanadi
        return Promise.reject(toApiError(error));
      }
    }

    // /auth/refresh yoki /auth/signout ning o'zi 401 bersa: sessiya tugagan.
    if (status === 401 && (url.startsWith('/auth/refresh') || url.startsWith('/auth/signout'))) {
      endSession();
    }

    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- butun ilova ApiError tipiga tayanadi
    return Promise.reject(toApiError(error));
  },
);

/**
 * orval uchun custom mutator.
 * Generatsiya qilingan barcha hooklar shu funksiya orqali so'rov yuboradi.
 */
export const apiMutator = async <T>(config: AxiosRequestConfig): Promise<T> => {
  const response = await api.request<T>(config);
  return response.data;
};

export default apiMutator;
export type { ApiError };
