import { useSyncExternalStore } from 'react';

/**
 * Kirish oqimining oraliq holati (login → OTP → ichkarida).
 *
 * Bu yerda TOKEN ham, foydalanuvchi ma'lumoti ham saqlanmaydi — faqat oqimni
 * davom ettirish uchun zarur qiymatlar: telefon raqam va taymer vaqtlari.
 * sessionStorage'da saqlanadi, shuning uchun sahifa yangilansa taymerlar
 * to'g'ri ishlashda davom etadi (topshiriq 2.3).
 */

const STORAGE_KEY = 'hisobx-auth-flow';

export type AuthFlowPurpose = 'signin' | 'reset';

export type AuthFlow = {
  purpose: AuthFlowPurpose;
  phone: string;
  /** Kod qachon eskiradi (ISO). */
  expiresAt: string | null;
  /** Qayta yuborish qachondan mumkin (ISO). */
  resendAvailableAt: string | null;
  /** Urinish oynasi (10 daqiqa) qachon tugaydi (ISO). */
  windowExpiresAt: string | null;
  /** Qolgan urinishlar soni (backend bermasa, standart 3 tadan sanaymiz). */
  attemptsLeft: number;
  /** Faqat dev rejimida ko'rsatiladi. */
  devCode: string | null;
  /** TODO(backend) 5.2-3: Telegramga ulanish uchun. */
  linkToken: string | null;
  botUrl: string | null;
  linkExpiresAt: string | null;
  qrToken?: string | null;
  qrBotUrl?: string | null;
};

export const DEFAULT_OTP_ATTEMPTS = 3;
/** Urinish oynasi — 10 daqiqa (topshiriq 2.3). */
export const OTP_WINDOW_MS = 10 * 60 * 1000;

let current: AuthFlow | null = readStored();
const listeners = new Set<() => void>();

function readStored(): AuthFlow | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthFlow) : null;
  } catch {
    return null;
  }
}

function persist(value: AuthFlow | null) {
  try {
    if (value === null) sessionStorage.removeItem(STORAGE_KEY);
    else sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // sessionStorage yopiq bo'lsa, oqim faqat shu sahifa umrida ishlaydi.
  }
}

function emit() {
  for (const listener of listeners) listener();
}

export function getAuthFlow(): AuthFlow | null {
  return current;
}

export function setAuthFlow(value: AuthFlow | null) {
  current = value;
  persist(value);
  emit();
}

export function patchAuthFlow(patch: Partial<AuthFlow>) {
  if (!current) return;
  setAuthFlow({ ...current, ...patch });
}

export function clearAuthFlow() {
  setAuthFlow(null);
}

/** Oqim boshlanganda chaqiriladi. */
export function startAuthFlow(
  purpose: AuthFlowPurpose,
  phone: string,
  patch: Partial<AuthFlow> = {},
): AuthFlow {
  const flow: AuthFlow = {
    purpose,
    phone,
    expiresAt: null,
    resendAvailableAt: null,
    windowExpiresAt: new Date(Date.now() + OTP_WINDOW_MS).toISOString(),
    attemptsLeft: DEFAULT_OTP_ATTEMPTS,
    devCode: null,
    linkToken: null,
    botUrl: null,
    linkExpiresAt: null,
    ...patch,
  };
  setAuthFlow(flow);
  return flow;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Komponentlar oqim holatini shu hook orqali kuzatadi. */
export function useAuthFlow(): AuthFlow | null {
  return useSyncExternalStore(subscribe, getAuthFlow, () => null);
}
