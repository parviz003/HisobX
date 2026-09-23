/**
 * Backend rasm manzilini brauzer ocha oladigan ko'rinishga keltiradi.
 *
 * TODO(backend): hozir `imageUrl` ABSOLYUT manzil sifatida keladi va uning
 * porti backend portidan farq qiladi (`.env` dagi `BASE_URL` = localhost:3000,
 * server esa 3010 da ishlaydi). Bunday manzil brauzerda ochilmaydi.
 * Shuning uchun manzildan faqat yo'l qismini olib, Vite proxy (dev) yoki
 * nginx (prod) orqali o'tkazamiz. Backend nisbiy `/api/v1/uploads/...`
 * qaytara boshlasa, bu funksiya hech narsani o'zgartirmaydi.
 */
export function resolveImageUrl(
  value: string | null | undefined,
): string | undefined {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (trimmed === '') return undefined;

  // Ma'lumot URL'i yoki blob — o'zgartirmaymiz.
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      // Faqat yo'l + so'rov qismini qoldiramiz — o'z domenimizdan so'raladi.
      return `${url.pathname}${url.search}`;
    } catch {
      return trimmed;
    }
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}
