/**
 * Sessiya hodisalari va tab'lar o'rtasidagi sinxronizatsiya.
 *
 * Bu yerda TOKEN saqlanmaydi — tokenlar faqat httpOnly cookie'da.
 * BroadcastChannel orqali bitta tab'dagi chiqish boshqa tab'larni ham chiqaradi.
 */

const CHANNEL_NAME = 'hisobx-session';

export type SessionEvent = { type: 'signed-out'; reason: 'manual' | 'expired' };

type Listener = (event: SessionEvent) => void;

const listeners = new Set<Listener>();

let channel: BroadcastChannel | null = null;
try {
  channel = 'BroadcastChannel' in globalThis ? new BroadcastChannel(CHANNEL_NAME) : null;
} catch {
  channel = null;
}

if (channel) {
  channel.onmessage = (event: MessageEvent<SessionEvent>) => {
    // Boshqa tab'dan kelgan hodisani faqat lokal tinglovchilarga uzatamiz
    // (qayta broadcast qilsak, aylanma hosil bo'ladi).
    for (const listener of listeners) listener(event.data);
  };
}

export function onSessionEvent(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Hodisani shu tab'da ham, boshqa tab'larda ham e'lon qiladi. */
export function emitSessionEvent(event: SessionEvent) {
  for (const listener of listeners) listener(event);
  try {
    channel?.postMessage(event);
  } catch {
    // Kanal yopilgan bo'lsa, lokal tinglovchilar baribir xabardor bo'ldi.
  }
}

/** SUPERADMIN ko'rish rejimidagi do'kon konteksti (token emas — oddiy UI holati). */
const STORE_KEY = 'hisobx-impersonated-store';
let impersonatedStoreId: number | null = null;

try {
  const raw = sessionStorage.getItem(STORE_KEY);
  impersonatedStoreId = raw ? Number(raw) || null : null;
} catch {
  impersonatedStoreId = null;
}

export function getImpersonatedStoreId(): number | null {
  return impersonatedStoreId;
}

export function setImpersonatedStoreId(storeId: number | null) {
  impersonatedStoreId = storeId;
  try {
    if (storeId === null) sessionStorage.removeItem(STORE_KEY);
    else sessionStorage.setItem(STORE_KEY, String(storeId));
  } catch {
    // sessionStorage yopiq bo'lsa, kontekst faqat shu sahifa umri davomida saqlanadi.
  }
}
