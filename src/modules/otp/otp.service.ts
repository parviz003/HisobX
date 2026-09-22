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

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(private readonly redisService: RedisService) {}

  private normalizePhone(value: string): string {
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

  private hashOtp(phone: string, code: string): string {
    return createHmac('sha256', env.OTP.SECRET)
      .update(`${phone}:${code}`)
      .digest('hex');
  }

  private otpKey(phone: string) {
    return `otp:value:${phone}`;
  }

  private attemptsKey(phone: string) {
    return `otp:attempts:${phone}`;
  }

  private resendKey(phone: string) {
    return `otp:resend:${phone}`;
  }

  async sendOtp(phoneInput: string) {
    const redis = this.redisService.client;
    const phone = this.normalizePhone(phoneInput);
    const otpKey = this.otpKey(phone);
    const attemptsKey = this.attemptsKey(phone);
    const resendKey = this.resendKey(phone);

    let cooldown: string | null = null;
    try {
      cooldown = await redis.set(resendKey, '1', 'EX', env.OTP.RESEND, 'NX');
    } catch (e) {
      throw new ServiceUnavailableException(
        'OTP xizmati vaqtincha ishlamayapti. Keyinroq urinib ko\u2018ring',
      );
    }

    if (cooldown !== 'OK') {
      const remaining = await redis.ttl(resendKey);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `OTP qayta yuborish uchun ${Math.max(
            remaining,
            1,
          )} sekund kuting`,
          retryAfter: Math.max(remaining, 1),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = this.generateOtp();
    const otpHash = this.hashOtp(phone, code);

    try {
      await redis
        .multi()
        .set(otpKey, otpHash, 'EX', env.OTP.TTL)
        .set(attemptsKey, '0', 'EX', env.OTP.TTL)
        .exec();
    } catch (error) {
      throw new ServiceUnavailableException(
        'OTP saqlashda xatolik. Keyinroq urinib ko\u2018ring',
      );
    }

    this.logger.log(`[LOCAL SMS] Qabul qiluvchi: ${phone} -> Kod: ${code}`);

    return {
      code, // Local / dev uchun kod qaytariladi
      phone,
      message: `Tasdiqlash kodi: ${code}`,
      expiresIn: env.OTP.TTL,
      resendAfter: env.OTP.RESEND,
    };
  }

  async verifyOtp(phoneInput: string, code: string) {
    const redis = this.redisService.client;
    const phone = this.normalizePhone(phoneInput);
    const otpKey = this.otpKey(phone);
    const attemptsKey = this.attemptsKey(phone);
    const candidateHash = this.hashOtp(phone, code);

    const script = `
      local stored = redis.call('GET', KEYS[1])

      if not stored then
        return -2
      end

      local attempts =
        tonumber(redis.call('GET', KEYS[2]) or '0')

      local maxAttempts =
        tonumber(ARGV[2])

      if attempts >= maxAttempts then
        redis.call('DEL', KEYS[1], KEYS[2])
        return -1
      end

      if stored == ARGV[1] then
        redis.call('DEL', KEYS[1], KEYS[2])
        return 1
      end

      attempts =
        redis.call('INCR', KEYS[2])

      local otpTtl =
        redis.call('TTL', KEYS[1])

      if otpTtl > 0 then
        redis.call(
          'EXPIRE',
          KEYS[2],
          otpTtl
        )
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
          String(env.OTP.ATTEMPTS),
        ),
      );
    } catch (e: any) {
      if (e instanceof HttpException) throw e;
      throw new ServiceUnavailableException(
        'OTP tekshirish xizmati ishlamayapti. Keyinroq urinib ko\u2018ring',
      );
    }

    if (result === -2) {
      throw new BadRequestException('OTP kodi mavjud emas yoki muddati tugagan');
    }

    if (result === -1) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'OTP kiritish urinishlari soni tugadi. Yangi kod so\u2018rang.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (result !== 1) {
      throw new BadRequestException('OTP kodi noto\u2018g\u2018ri');
    }

    return {
      success: true,
      verified: true,
      phone,
    };
  }

  private signInKey(phone: string) {
    return `otp:signin:${phone}`;
  }

  /** Parol tekshiruvidan o'tgan signIn urinishini belgilab qo'yadi */
  async markSignInPending(phoneInput: string): Promise<void> {
    const phone = this.normalizePhone(phoneInput);
    try {
      await this.redisService.client.set(
        this.signInKey(phone),
        '1',
        'EX',
        env.OTP.TTL,
      );
    } catch (e) {
      throw new ServiceUnavailableException('Sessiya saqlashda xatolik');
    }
  }

  /** OTP tasdiqlashdan oldin signIn urinishi bor-yo'qligini tekshiradi */
  async consumeSignInPending(phoneInput: string): Promise<void> {
    const phone = this.normalizePhone(phoneInput);
    let exists = 0;
    try {
      exists = await this.redisService.client.del(this.signInKey(phone));
    } catch (e) {
      throw new ServiceUnavailableException('Sessiya tekshirishda xatolik');
    }
    if (!exists) {
      throw new BadRequestException(
        'Avval telefon raqam va parol bilan tizimga kiring',
      );
    }
  }
}
