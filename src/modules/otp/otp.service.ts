import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHmac, randomInt } from 'crypto';
import { RedisService } from '../../config/redis/redis.service';
import { env } from '../../config';

/** OTP kodining maqsadi — kalitlar maqsad bo'yicha ajratiladi */
export type OtpPurpose = 'signin' | 'reset';

export interface OtpSendResult {
  phone: string;
  message: string;
  /** Kod faqat development muhitida qaytariladi */
  code?: string;
  expiresAt: string;
  resendAvailableAt: string;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(private readonly redisService: RedisService) {}

  normalizePhone(value: string): string {
    const phone = value.replace(/\D/g, '');
    if (!/^998\d{9}$/.test(phone)) {
      throw new BadRequestException(
        'Telefon raqam noto‘g‘ri. Masalan: +998901234567',
      );
    }
    return phone;
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

  private tooManyRequests(retryAfter: number): never {
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: `OTP qayta yuborish uchun ${retryAfter} sekund kuting`,
        details: { retryAfter },
      },
      HttpStatus.TOO_MANY_REQUESTS,
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
      throw new ServiceUnavailableException(
        'OTP xizmati vaqtincha ishlamayapti. Keyinroq urinib ko‘ring',
      );
    }

    if (cooldown !== 'OK') {
      const remaining = await redis.ttl(resendKey);
      this.tooManyRequests(Math.max(remaining, 1));
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
      throw new ServiceUnavailableException(
        'OTP saqlashda xatolik. Keyinroq urinib ko‘ring',
      );
    }

    this.logger.log(
      `[LOCAL SMS] purpose=${purpose} Qabul qiluvchi: ${phone} -> Kod: ${code}`,
    );

    return {
      phone,
      message: 'Tasdiqlash kodi yuborildi',
      ...(env.IS_DEV ? { code } : {}),
      expiresAt: new Date(now + env.OTP.TTL_SECONDS * 1000).toISOString(),
      resendAvailableAt: new Date(
        now + env.OTP.RESEND_COOLDOWN_SECONDS * 1000,
      ).toISOString(),
    };
  }

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

    const script = `
      local stored = redis.call('GET', KEYS[1])

      if not stored then
        return -2
      end

      local attempts = tonumber(redis.call('GET', KEYS[2]) or '0')
      local maxAttempts = tonumber(ARGV[2])

      if attempts >= maxAttempts then
        redis.call('DEL', KEYS[1], KEYS[2])
        return -1
      end

      if stored == ARGV[1] then
        redis.call('DEL', KEYS[1], KEYS[2])
        return 1
      end

      attempts = redis.call('INCR', KEYS[2])
      local otpTtl = redis.call('TTL', KEYS[1])

      if otpTtl > 0 then
        redis.call('EXPIRE', KEYS[2], otpTtl)
      end

      if attempts >= maxAttempts then
        redis.call('DEL', KEYS[1], KEYS[2])
        return -1
      end

      return 0
    `;

    let result: number;
    try {
      result = Number(
        await redis.eval(
          script,
          2,
          otpKey,
          attemptsKey,
          candidateHash,
          String(env.OTP.MAX_ATTEMPTS),
        ),
      );
    } catch (e: any) {
      if (e instanceof HttpException) throw e;
      throw new ServiceUnavailableException(
        'OTP tekshirish xizmati ishlamayapti. Keyinroq urinib ko‘ring',
      );
    }

    if (result === -2) {
      throw new BadRequestException('OTP kodi mavjud emas yoki muddati tugagan');
    }

    if (result === -1) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message:
            'OTP kiritish urinishlari soni tugadi. Yangi kod so‘rang.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (result !== 1) {
      throw new BadRequestException('OTP kodi noto‘g‘ri');
    }

    return { verified: true, phone };
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
      throw new ServiceUnavailableException('Sessiya saqlashda xatolik');
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
      throw new ServiceUnavailableException('Sessiya tekshirishda xatolik');
    }
    if (!exists) {
      throw new BadRequestException(
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
      throw new ServiceUnavailableException('Sessiya tekshirishda xatolik');
    }
    if (!removed) {
      throw new BadRequestException(
        'Avval telefon raqam va parol bilan tizimga kiring',
      );
    }
  }
}
