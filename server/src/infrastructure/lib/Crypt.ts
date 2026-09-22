import bcrypt from 'bcrypt';
import { createHmac, timingSafeEqual } from 'crypto';
import { env } from '../../config';

export class Crypt {
  static async hash(data: string): Promise<string> {
    return bcrypt.hash(data, 7);
  }

  static async compare(data: string, hashedData: string): Promise<boolean> {
    if (!hashedData) return false;
    return bcrypt.compare(data, hashedData);
  }

  /**
   * JWT kabi uzun matnlar uchun. bcrypt faqat birinchi 72 baytni hisobga oladi,
   * shuning uchun tokenlar HMAC-SHA256 bilan xeshlanadi.
   */
  static hashToken(token: string): string {
    return createHmac('sha256', env.TOKEN.REFRESH_KEY)
      .update(token)
      .digest('hex');
  }

  static compareToken(token: string, hashedToken: string): boolean {
    if (!token || !hashedToken) return false;
    const a = Buffer.from(this.hashToken(token), 'hex');
    const b = Buffer.from(hashedToken, 'hex');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }
}
