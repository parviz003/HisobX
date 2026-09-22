import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';

/**
 * Telefon raqam bilan ishlash.
 *
 * Saqlash va javob berishning yagona formati — E.164: `+998901234567`.
 * Kiruvchi ma'lumot `998901234567`, `+998 90 123 45 67`, `90 123 45 67`
 * ko'rinishida kelishi mumkin — barchasi bir formatga keltiriladi.
 */
export class Phone {
  /** Faqat raqamlar, `+` siz: `998901234567` (Redis kalitlari va ichki solishtirish uchun) */
  static digits(value: string): string {
    const digits = String(value ?? '').replace(/\D/g, '');
    // Foydalanuvchi mamlakat kodisiz kiritsa (901234567) — to'ldiramiz
    if (/^\d{9}$/.test(digits)) return `998${digits}`;
    return digits;
  }

  /** To'g'ri bo'lsa `+998901234567`, aks holda `null` */
  static tryNormalize(value: string): string | null {
    const digits = this.digits(value);
    return /^998\d{9}$/.test(digits) ? `+${digits}` : null;
  }

  /** To'g'ri bo'lsa `+998901234567`, aks holda 400 */
  static normalize(value: string): string {
    const normalized = this.tryNormalize(value);
    if (!normalized) {
      throw new BadRequestException(
        "Telefon raqam noto'g'ri. Masalan: +998901234567",
      );
    }
    return normalized;
  }

  /** Ikki raqam bir xilmi (formatdan qat'i nazar) */
  static equals(a?: string | null, b?: string | null): boolean {
    if (!a || !b) return false;
    return this.digits(a) === this.digits(b);
  }
}

/**
 * DTO maydonini `+998901234567` formatiga keltiradi.
 * Validatsiya (`@IsPhoneNumber`) shundan keyin ishlaydi, shuning uchun
 * dekorator maydon ustida validatorlardan oldin turishi shart emas —
 * class-transformer har doim class-validator'dan oldin bajariladi.
 */
export const NormalizePhone = () =>
  Transform(({ value }) =>
    typeof value === 'string' ? (Phone.tryNormalize(value) ?? value) : value,
  );
