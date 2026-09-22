import { HttpException, Inject, Injectable } from '@nestjs/common';
import { createHmac, randomInt } from 'crypto';
import { RedisService } from '../../config/redis/redis.service';
import { env } from '../../config';
import { OTP_SENDER, type OtpSender } from './otp-sender.interface';
import { Phone } from '../../common/helper/phone';
import { BusinessException } from '../../common/errors/business.exception';
import { ErrorCode } from '../../common/errors/error-codes';

/** OTP kodining maqsadi — kalitlar maqsad bo'yicha ajratiladi */
export type OtpPurpose = 'signin' | 'reset';

export interface OtpSendResult {
  /** Har doim `+998901234567` formatida */
  phone: string;
  message: string;
  /** Kod faqat development muhitida qaytariladi */
  code?: string;
  expiresAt: string;
  resendAvailableAt: string;
}

@Injectable()
export class OtpService {
  constructor(
    private readonly redisService: RedisService,
    @Inject(OTP_SENDER) private readonly sender: OtpSender,
  ) {}

  /** Redis kalitlari uchun: faqat raqamlar (`998901234567`) */
  normalizePhone(value: string): string {
    // Format noto'g'ri bo'lsa 400 qaytadi
    Phone.normalize(value);
    return Phone.digits(value);
  }

  private generateOtp(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  private hashOtp(purpose: OtpPurpose, phone: string, code: string): string {
    return createHmac('sha256', env.OTP.SECRET)
      .update(`${purpose}:${phone}:${code}`)
      .digest('hex');
  }

  private otpKey(purpose: OtpPurpose, phone: string) {
    return `otp:${purpose}:value:${phone}`;
  }

  private attemptsKey(purpose: OtpPurpose, phone: string) {
    return `otp:${purpose}:attempts:${phone}`;
  }

  private resendKey(purpose: OtpPurpose, phone: string) {
    return `otp:${purpose}:resend:${phone}`;
  }

  private pendingKey(purpose: OtpPurpose, phone: string) {
    return `otp:${purpose}:pending:${phone}`;
  }

  private unavailable(message: string): never {
    throw new BusinessException(
      503,
      ErrorCode.OTP_SERVICE_UNAVAILABLE,
      message,
    );
  }

  /**
   * OTP yaratadi va Redis'da saqlaydi.
   * Qayta yuborilganda eski kod darhol bekor bo'ladi (kalit qayta yoziladi).
   */
  async sendOtp(
    phoneInput: string,
    purpose: OtpPurpose = 'signin',
  ): Promise<OtpSendResult> {
    const redis = this.redisService.client;
    const phone = this.normalizePhone(phoneInput);
    const otpKey = this.otpKey(purpose, phone);
    const attemptsKey = this.attemptsKey(purpose, phone);
    const resendKey = this.resendKey(purpose, phone);

    let cooldown: string | null = null;
    try {
      cooldown = await redis.set(
        resendKey,
        '1',
        'EX',
        env.OTP.RESEND_COOLDOWN_SECONDS,
        'NX',
      );
    } catch (e) {
      this.unavailable(
        "OTP xizmati vaqtincha ishlamayapti. Keyinroq urinib ko'ring",
      );
    }

    if (cooldown !== 'OK') {
      const remaining = Math.max(await redis.ttl(resendKey), 1);
      throw BusinessException.tooManyRequests(
        ErrorCode.OTP_RESEND_TOO_SOON,
        `OTP qayta yuborish uchun ${remaining} sekund kuting`,
        { retryAfter: remaining },
      );
    }

    const code = this.generateOtp();
    const otpHash = this.hashOtp(purpose, phone, code);
    const now = Date.now();

    try {
      // Eski kod va urinishlar hisobi darhol bekor qilinadi
      await redis
        .multi()
        .del(otpKey, attemptsKey)
        .set(otpKey, otpHash, 'EX', env.OTP.TTL_SECONDS)
        .set(attemptsKey, '0', 'EX', env.OTP.TTL_SECONDS)
        .exec();
    } catch (error) {
      this.unavailable("OTP saqlashda xatolik. Keyinroq urinib ko'ring");
    }

    await this.sender.send(phone, code, purpose);

    return {
      phone: `+${phone}`,
      message: 'Tasdiqlash kodi yuborildi',
      ...(env.IS_DEV ? { code } : {}),
      expiresAt: new Date(now + env.OTP.TTL_SECONDS * 1000).toISOString(),
      resendAvailableAt: new Date(
        now + env.OTP.RESEND_COOLDOWN_SECONDS * 1000,
      ).toISOString(),
    };
  }

  /**
   * Kodni tekshiradi.
   *
   * Xatolar:
   * - `OTP_EXPIRED` (400) — kod yo'q yoki muddati tugagan
   * - `OTP_INVALID` (400) — kod xato, `data.attemptsLeft` qolgan urinishlar
   * - `OTP_ATTEMPTS_EXCEEDED` (429) — urinishlar tugadi, kod bekor qilindi
   */
  async verifyOtp(
    phoneInput: string,
    code: string,
    purpose: OtpPurpose = 'signin',
  ) {
    const redis = this.redisService.client;
    const phone = this.normalizePhone(phoneInput);
    const otpKey = this.otpKey(purpose, phone);
    const attemptsKey = this.attemptsKey(purpose, phone);
    const candidateHash = this.hashOtp(purpose, phone, code);

    /*
     * Skript [holat, qolgan urinishlar] juftligini qaytaradi:
     *   [ 1, 0] — kod to'g'ri
     *   [ 0, n] — kod xato, yana n ta urinish bor
     *   [-1, 0] — urinishlar tugadi (kod o'chirildi)
     *   [-2, 0] — kod yo'q yoki muddati tugagan
     */
    const script = `
      local stored = redis.call('GET', KEYS[1])

      if not stored then
        return {-2, 0}
      end

      local attempts = tonumber(redis.call('GET', KEYS[2]) or '0')
      local maxAttempts = tonumber(ARGV[2])

      if attempts >= maxAttempts then
        redis.call('DEL', KEYS[1], KEYS[2])
        return {-1, 0}
      end

      if stored == ARGV[1] then
        redis.call('DEL', KEYS[1], KEYS[2])
        return {1, 0}
      end

      attempts = redis.call('INCR', KEYS[2])
      local otpTtl = redis.call('TTL', KEYS[1])

      if otpTtl > 0 then
        redis.call('EXPIRE', KEYS[2], otpTtl)
      end

      if attempts >= maxAttempts then
        redis.call('DEL', KEYS[1], KEYS[2])
        return {-1, 0}
      end

      return {0, maxAttempts - attempts}
    `;

    let status: number;
    let attemptsLeft: number;
    try {
      const raw = (await redis.eval(
        script,
        2,
        otpKey,
        attemptsKey,
        candidateHash,
        String(env.OTP.MAX_ATTEMPTS),
      )) as [number, number];
      status = Number(raw?.[0]);
      attemptsLeft = Number(raw?.[1] ?? 0);
    } catch (e: any) {
      if (e instanceof HttpException) throw e;
      this.unavailable(
        "OTP tekshirish xizmati ishlamayapti. Keyinroq urinib ko'ring",
      );
    }

    if (status === -2) {
      throw BusinessException.badRequest(
        ErrorCode.OTP_EXPIRED,
        'Kod muddati tugagan. Yangi kod so‘rang',
      );
    }

    if (status === -1) {
      throw BusinessException.tooManyRequests(
        ErrorCode.OTP_ATTEMPTS_EXCEEDED,
        'Kod kiritish urinishlari tugadi. Yangi kod so‘rang',
      );
    }

    if (status !== 1) {
      throw BusinessException.badRequest(ErrorCode.OTP_INVALID, 'Kod xato', {
        attemptsLeft,
      });
    }

    return { verified: true, phone: `+${phone}` };
  }

  /* ----------------------- Kutilayotgan urinish belgisi ---------------------- */

  /** Parol tekshiruvidan o'tgan urinishni belgilab qo'yadi */
  async markPending(phoneInput: string, purpose: OtpPurpose): Promise<void> {
    const phone = this.normalizePhone(phoneInput);
    try {
      await this.redisService.client.set(
        this.pendingKey(purpose, phone),
        '1',
        'EX',
        env.OTP.PENDING_WINDOW_SECONDS,
      );
    } catch (e) {
      this.unavailable('Sessiya saqlashda xatolik');
    }
  }

  /** Urinish mavjudligini tekshiradi (belgini o'chirmaydi) */
  async assertPending(phoneInput: string, purpose: OtpPurpose): Promise<void> {
    const phone = this.normalizePhone(phoneInput);
    let exists = 0;
    try {
      exists = await this.redisService.client.exists(
        this.pendingKey(purpose, phone),
      );
    } catch (e) {
      this.unavailable('Sessiya tekshirishda xatolik');
    }
    if (!exists) {
      throw BusinessException.badRequest(
        ErrorCode.OTP_NOT_PENDING,
        'Avval telefon raqam va parol bilan tizimga kiring',
      );
    }
  }

  /** Urinishni tekshiradi va belgini o'chiradi */
  async consumePending(phoneInput: string, purpose: OtpPurpose): Promise<void> {
    const phone = this.normalizePhone(phoneInput);
    let removed = 0;
    try {
      removed = await this.redisService.client.del(
        this.pendingKey(purpose, phone),
      );
    } catch (e) {
      this.unavailable('Sessiya tekshirishda xatolik');
    }
    if (!removed) {
      throw BusinessException.badRequest(
        ErrorCode.OTP_NOT_PENDING,
        'Avval telefon raqam va parol bilan tizimga kiring',
      );
    }
  }
}
