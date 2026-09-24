import { HttpException, Logger, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../config/database/prisma.service';
import { SignInDto } from './dto/sign-in.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Crypt } from '../../infrastructure/lib/Crypt';
import { successRes } from '../../common/helper/success-response';
import { OtpService } from '../otp/otp.service';
import { VerifyOTPDto } from '../otp/dto/verify-otp.dto';
import { Token } from '../../infrastructure/lib/Token';
import type { Response, Request } from 'express';
import { getDeviceInfo } from '../../common/helper/device-info';
import { Role, Status } from '@prisma/client';
import { RedisService } from '../../config/redis/redis.service';
import { env } from '../../config';
import { IPayload } from '../../common/interface';
import { BusinessException } from '../../common/errors/business.exception';
import { ErrorCode } from '../../common/errors/error-codes';
import { Phone } from '../../common/helper/phone';
import { DeviceService } from './device.service';
import { TelegramLinkService } from '../telegram/telegram-link.service';
import { TelegramApi } from '../../infrastructure/lib/TelegramApi';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly db: PrismaService,
    private readonly otp: OtpService,
    private readonly redis: RedisService,
    private readonly devices: DeviceService,
    private readonly telegramLinks: TelegramLinkService,
  ) {}

  async signIn(dto: SignInDto) {
    const phone = Phone.normalize(dto.phone);
    await this.assertNotLockedOut(phone);

    const user = await this.db.user.findUnique({ where: { phone } });
    const isMatchPass = await Crypt.compare(
      dto.password,
      user ? user.password : '',
    );
    if (!isMatchPass || !user) {
      await this.registerFailedLogin(phone);
      throw BusinessException.badRequest(
        ErrorCode.INVALID_CREDENTIALS,
        'Telefon raqam yoki parol xato',
      );
    }
    await this.clearFailedLogins(phone);
    this.assertUserActive(user);

    /*
     * Kodlar faqat Telegram orqali boradi. Hisob hali botga ulanmagan bo'lsa,
     * kod yuborilmaydi — foydalanuvchiga bir martalik ulash havolasi beriladi.
     *
     * ISTISNO: development'da bot tokeni umuman sozlanmagan bo'lsa, ulash
     * oqimini talab qilish localhost'da kirishni butunlay to'sib qo'yardi
     * (bot yo'q -> ulab bo'lmaydi -> kod kelmaydi). Bunday holatda kod
     * odatdagidek beriladi va logga yoziladi. Production'da bu yo'l yopiq.
     */
    const telegramRequired =
      TelegramApi.isConfigured || !env.IS_DEV || !env.TELEGRAM.DEV_FALLBACK;

    if (!user.telegramChatId && telegramRequired) {
      const invite = await this.telegramLinks.createInvite(user);
      return successRes(
        { telegramLinked: false, phone: user.phone, ...invite },
        200,
      );
    }

    const qrToken = randomBytes(16).toString('hex');
    const qrKey = `auth:qr:${qrToken}`;
    await this.redis.client.set(
      qrKey,
      JSON.stringify({
        userId: user.id,
        phone: user.phone,
        status: 'pending',
      }),
      'EX',
      env.OTP.PENDING_WINDOW_SECONDS,
    );
    const qrBotUrl = TelegramApi.startUrl(`login_${qrToken}`);

    const data = await this.otp.sendOtp(user.phone, 'signin');
    await this.otp.markPending(user.phone, 'signin');
    return successRes(
      { telegramLinked: true, qrToken, qrBotUrl, ...data },
      200,
    );
  }

  /**
   * QR orqali kirish holatini tekshirish (telefon botda tasdiqlaganini tekshiradi)
   */
  async checkQrLoginStatus(qrToken: string, req: Request, res: Response) {
    if (!qrToken) {
      return successRes({ status: 'invalid' }, 200);
    }
    const key = `auth:qr:${qrToken}`;
    const raw = await this.redis.client.get(key);
    if (!raw) {
      return successRes({ status: 'expired' }, 200);
    }

    const data = JSON.parse(raw) as {
      userId: number;
      phone: string;
      status: string;
    };
    if (data.status !== 'confirmed') {
      return successRes({ status: 'pending' }, 200);
    }

    // Telefon orqali tasdiqlangan — tizimga kirish sessiyasini yakunlaymiz
    const user = await this.db.user.findUnique({
      where: { id: data.userId },
    });
    if (!user) {
      throw BusinessException.notFound(
        ErrorCode.USER_NOT_FOUND,
        'Foydalanuvchi topilmadi',
      );
    }
    this.assertUserActive(user);

    await this.otp.consumePending(user.phone, 'signin').catch(() => {});
    await this.redis.client.del(key);

    const info = getDeviceInfo(req);

    let device = await this.db.devices.findFirst({
      where: { userId: user.id, device: info.device },
    });

    if (!device) {
      const deviceCount = await this.db.devices.count({
        where: { userId: user.id },
      });
      if (deviceCount >= env.DEVICE.LIMIT_PER_USER) {
        throw BusinessException.forbidden(
          ErrorCode.DEVICE_LIMIT_REACHED,
          `Qurilmalar soni ${env.DEVICE.LIMIT_PER_USER} tadan oshmasligi kerak. Avval eski qurilmalardan birini o'chiring`,
          {
            limit: env.DEVICE.LIMIT_PER_USER,
            devices: await this.devices.listForUser(user.id),
          },
        );
      }
      device = await this.db.devices.create({
        data: {
          userId: user.id,
          device: info.device,
          browser: info.browser,
          os: info.os,
          deviceType: info.deviceType,
          ip: info.ip,
          hashedRefreshToken: '',
        },
      });
    }

    const payload: IPayload = {
      sub: user.id,
      role: user.role,
      status: user.status,
      deviceId: device.deviceId,
      storeId: user.storeId,
    };

    const { accessToken, refreshToken } = await Token.getToken(payload);
    const hashedRefreshToken = Crypt.hashToken(refreshToken);

    device = await this.db.devices.update({
      where: { deviceId: device.deviceId },
      data: {
        hashedRefreshToken,
        prevHashedRefreshToken: null,
        prevTokenExpiresAt: null,
        prevTokenUsed: false,
        browser: info.browser,
        os: info.os,
        deviceType: info.deviceType,
        ip: info.ip,
        lastActiveAt: new Date(),
      },
    });

    Token.setCookie(res, accessToken, refreshToken);

    return successRes(
      {
        status: 'confirmed',
        userId: device.userId,
        deviceId: device.deviceId,
        device: device.device,
        role: user.role,
        storeId: user.storeId,
        phone: user.phone,
        fullName: user.fullName,
        createdAt: device.createdAt,
      },
      200,
    );
  }

  /**
   * Ulanish holati — ilova shu yerni qisqa oraliqda so'rab turadi.
   * Javob token mavjudligini oshkor qilmaydi.
   */
  async telegramLinkStatus(token: string) {
    return successRes(await this.telegramLinks.status(token), 200);
  }

  /* ----------------- Ketma-ket xato parollardan himoya (Redis) ---------------- */

  private loginKeys(phone: string) {
    const normalized = phone.replace(/\D/g, '');
    return {
      failKey: `login:fail:${normalized}`,
      blockKey: `login:block:${normalized}`,
    };
  }

  /** Raqam bloklangan bo'lsa 429 (Retry-After bilan) qaytaradi */
  private async assertNotLockedOut(phone: string) {
    const { blockKey } = this.loginKeys(phone);
    let ttl = -2;
    try {
      ttl = await this.redis.client.ttl(blockKey);
    } catch (e) {
      return; // Redis ishlamasa, kirishni to'sib qo'ymaymiz
    }
    if (ttl > 0) {
      throw BusinessException.tooManyRequests(
        ErrorCode.LOGIN_BLOCKED,
        `Ketma-ket xato urinishlar sababli bu raqam vaqtincha bloklangan. ${Math.ceil(
          ttl / 60,
        )} daqiqadan so'ng urinib ko'ring`,
        { retryAfter: ttl },
      );
    }
  }

  private async registerFailedLogin(phone: string) {
    const { failKey, blockKey } = this.loginKeys(phone);
    const blockSeconds = env.LOGIN.BLOCK_MINUTES * 60;
    try {
      const attempts = await this.redis.client.incr(failKey);
      if (attempts === 1) {
        await this.redis.client.expire(failKey, blockSeconds);
      }
      if (attempts >= env.LOGIN.MAX_FAILED_ATTEMPTS) {
        await this.redis.client
          .multi()
          .set(blockKey, '1', 'EX', blockSeconds)
          .del(failKey)
          .exec();
        throw BusinessException.tooManyRequests(
          ErrorCode.LOGIN_BLOCKED,
          `Ketma-ket ${env.LOGIN.MAX_FAILED_ATTEMPTS} ta xato urinish. Raqam ${env.LOGIN.BLOCK_MINUTES} daqiqaga bloklandi`,
          { retryAfter: blockSeconds },
        );
      }
    } catch (e) {
      if (e instanceof HttpException) throw e;
      // Redis ishlamasa hisoblagich yuritilmaydi
    }
  }

  private async clearFailedLogins(phone: string) {
    const { failKey, blockKey } = this.loginKeys(phone);
    try {
      await this.redis.client.del(failKey, blockKey);
    } catch (e) {
      // e'tiborsiz
    }
  }

  async confirmSignIn(dto: VerifyOTPDto, req: Request, res: Response) {
    const phone = Phone.normalize(dto.phone);
    const user = await this.db.user.findUnique({ where: { phone } });
    if (!user) {
      throw BusinessException.notFound(
        ErrorCode.USER_NOT_FOUND,
        'Foydalanuvchi topilmadi',
      );
    }
    this.assertUserActive(user);

    // OTP faqat parol tekshiruvidan o'tgan signIn urinishi uchun tasdiqlanadi
    await this.otp.verifyOtp(user.phone, dto.code, 'signin');
    await this.otp.consumePending(user.phone, 'signin');

    const info = getDeviceInfo(req);

    // Bir xil qurilmadan qayta kirilsa yangi sessiya ochilmaydi, eskisi yangilanadi
    let device = await this.db.devices.findFirst({
      where: { userId: user.id, device: info.device },
    });

    if (!device) {
      /*
       * Limit HAR BIR FOYDALANUVCHI uchun hisoblanadi (do'kon uchun emas):
       * bitta do'konda bir nechta xodim bo'lsa, har biri o'z limitiga ega.
       */
      const deviceCount = await this.db.devices.count({
        where: { userId: user.id },
      });
      if (deviceCount >= env.DEVICE.LIMIT_PER_USER) {
        throw BusinessException.forbidden(
          ErrorCode.DEVICE_LIMIT_REACHED,
          `Qurilmalar soni ${env.DEVICE.LIMIT_PER_USER} tadan oshmasligi kerak. Avval eski qurilmalardan birini o'chiring`,
          {
            limit: env.DEVICE.LIMIT_PER_USER,
            devices: await this.devices.listForUser(user.id),
          },
        );
      }
      device = await this.db.devices.create({
        data: {
          userId: user.id,
          device: info.device,
          browser: info.browser,
          os: info.os,
          deviceType: info.deviceType,
          ip: info.ip,
          hashedRefreshToken: '',
        },
      });
    }

    const payload: IPayload = {
      sub: user.id,
      role: user.role,
      status: user.status,
      deviceId: device.deviceId,
      storeId: user.storeId,
    };

    const { accessToken, refreshToken } = await Token.getToken(payload);
    const hashedRefreshToken = Crypt.hashToken(refreshToken);

    device = await this.db.devices.update({
      where: { deviceId: device.deviceId },
      data: {
        hashedRefreshToken,
        prevHashedRefreshToken: null,
        prevTokenExpiresAt: null,
        prevTokenUsed: false,
        // Qurilma tafsilotlari va faollik vaqti har kirishda yangilanadi
        browser: info.browser,
        os: info.os,
        deviceType: info.deviceType,
        ip: info.ip,
        lastActiveAt: new Date(),
      },
    });

    Token.setCookie(res, accessToken, refreshToken);

    return successRes(
      {
        userId: device.userId,
        deviceId: device.deviceId,
        device: device.device,
        role: user.role,
        storeId: user.storeId,
        phone: user.phone,
        fullName: user.fullName,
        createdAt: device.createdAt,
      },
      200,
    );
  }

  /** Bloklangan yoki o'chirilgan hisob uchun yagona xato */
  private assertUserActive(user: { isActive: boolean; status: Status }) {
    if (!user.isActive || user.status !== Status.ACTIVE) {
      throw BusinessException.forbidden(
        ErrorCode.ACCOUNT_INACTIVE,
        'Hisobingiz faol emas',
      );
    }
  }

  /**
   * Refresh token rotatsiyasi.
   * Oldingi token rotatsiyadan keyin REFRESH_GRACE_SECONDS davomida bir marta
   * qabul qilinadi (bir nechta tab bir vaqtda refresh qilganda chiqib ketmaslik uchun).
   * Grace oynasidan tashqari eski token ishlatilsa — o'g'irlik belgisi:
   * shu qurilma sessiyasi bekor qilinadi.
   */
  async refreshToken(refreshToken: string, res: Response, req?: Request) {
    if (!refreshToken) {
      // Sessiya yo'q — frontend uchun 401 yagona "qaytadan kiring" signali
      throw BusinessException.unauthorized(
        ErrorCode.REFRESH_TOKEN_MISSING,
        'Sessiya topilmadi. Qaytadan tizimga kiring',
      );
    }
    const verifiedData = await Token.verifyToken(refreshToken, 'refresh');
    const device = await this.db.devices.findUnique({
      where: { deviceId: verifiedData.deviceId },
    });
    if (!device) {
      throw BusinessException.unauthorized(
        ErrorCode.SESSION_EXPIRED,
        'Sessiya topilmadi. Qaytadan tizimga kiring',
      );
    }

    const isCurrent = Crypt.compareToken(
      refreshToken,
      device.hashedRefreshToken,
    );
    const isPrevious =
      !isCurrent &&
      !!device.prevHashedRefreshToken &&
      Crypt.compareToken(refreshToken, device.prevHashedRefreshToken);

    if (!isCurrent && !isPrevious) {
      // Notanish token: sessiyani bekor qilamiz
      await this.db.devices.delete({ where: { deviceId: device.deviceId } });
      Token.clearCookie(res);
      throw BusinessException.unauthorized(
        ErrorCode.SESSION_REVOKED,
        'Sessiya bekor qilindi. Qaytadan tizimga kiring',
      );
    }

    if (isPrevious) {
      const graceValid =
        !!device.prevTokenExpiresAt && device.prevTokenExpiresAt > new Date();
      if (!graceValid || device.prevTokenUsed) {
        // Eski token qayta ishlatildi — o'g'irlik belgisi
        await this.db.devices.delete({ where: { deviceId: device.deviceId } });
        Token.clearCookie(res);
        this.logger.warn(
          `Refresh token qayta ishlatildi (grace tashqarisida): deviceId=${device.deviceId} userId=${device.userId}`,
        );
        throw BusinessException.unauthorized(
          ErrorCode.SESSION_REVOKED,
          'Sessiya xavfsizlik sababli bekor qilindi. Qaytadan tizimga kiring',
        );
      }
    }

    const user = await this.db.user.findUnique({
      where: { id: device.userId },
    });
    if (!user) {
      throw BusinessException.notFound(
        ErrorCode.USER_NOT_FOUND,
        'Foydalanuvchi topilmadi',
      );
    }
    this.assertUserActive(user);

    // Token payloadi bazadagi dolzarb ma'lumot asosida qayta quriladi
    const payload = {
      sub: user.id,
      role: user.role,
      status: user.status,
      deviceId: device.deviceId,
      storeId: user.storeId,
    };

    const tokens = await Token.getToken(payload);
    const info = req ? getDeviceInfo(req) : undefined;
    const graceUntil = new Date(
      Date.now() + env.TOKEN.REFRESH_GRACE_SECONDS * 1000,
    );

    await this.db.devices.update({
      where: { deviceId: device.deviceId },
      data: {
        hashedRefreshToken: Crypt.hashToken(tokens.refreshToken),
        /*
         * Har qanday rotatsiyada joriy token "oldingi" bo'lib grace oynasiga
         * o'tadi. Shu sabab bir vaqtda refresh qilgan ikkinchi tab ham
         * (u joriy tokenni ushlab turgan bo'lsa) ishlashda davom etadi,
         * allaqachon almashtirilgan eski token esa endi hech qayerda saqlanmaydi
         * va ishlatilsa — sessiya bekor qilinadi.
         */
        prevHashedRefreshToken: device.hashedRefreshToken,
        prevTokenExpiresAt: graceUntil,
        prevTokenUsed: false,
        // Har refreshda faollik vaqti (va mavjud bo'lsa qurilma tafsilotlari) yangilanadi
        lastActiveAt: new Date(),
        ...(info
          ? {
              browser: info.browser,
              os: info.os,
              deviceType: info.deviceType,
              ip: info.ip,
            }
          : {}),
      },
    });

    Token.setCookie(res, tokens.accessToken, tokens.refreshToken);

    return successRes(
      {
        userId: device.userId,
        deviceId: device.deviceId,
        device: device.device,
        createdAt: device.createdAt,
      },
      200,
    );
  }

  /** Sign-in uchun OTP kodini qayta yuborish (parol tekshiruvi o'tgan urinish uchun) */
  async resendSignInOtp(phoneInput: string) {
    const phone = Phone.normalize(phoneInput);
    await this.otp.assertPending(phone, 'signin');
    const user = await this.db.user.findUnique({ where: { phone } });
    if (!user) {
      throw BusinessException.notFound(
        ErrorCode.USER_NOT_FOUND,
        'Foydalanuvchi topilmadi',
      );
    }

    const qrToken = randomBytes(16).toString('hex');
    const qrKey = `auth:qr:${qrToken}`;
    await this.redis.client.set(
      qrKey,
      JSON.stringify({
        userId: user.id,
        phone: user.phone,
        status: 'pending',
      }),
      'EX',
      env.OTP.PENDING_WINDOW_SECONDS,
    );
    const qrBotUrl = TelegramApi.startUrl(`login_${qrToken}`);

    const data = await this.otp.sendOtp(phone, 'signin');
    // Muddat cho'zilganda urinish belgisi ham yangilanadi
    await this.otp.markPending(phone, 'signin');
    return successRes(
      { telegramLinked: true, qrToken, qrBotUrl, ...data },
      200,
    );
  }

  /**
   * Parolni tiklash uchun OTP.
   * Raqam bazada bor-yo'qligidan qat'i nazar javob bir xil bo'ladi.
   */
  async forgotPassword(phoneInput: string) {
    const phone = Phone.normalize(phoneInput);
    const data = await this.otp.sendOtp(phone, 'reset');
    return successRes(
      {
        phone: data.phone,
        message:
          "Agar bu raqam tizimda mavjud bo'lsa, tasdiqlash kodi yuborildi",
        ...(data.code ? { code: data.code } : {}),
        expiresAt: data.expiresAt,
        resendAvailableAt: data.resendAvailableAt,
      },
      200,
    );
  }

  /** OTP bilan parolni tiklash: barcha sessiyalar bekor qilinadi */
  async resetPassword(dto: ResetPasswordDto) {
    const phone = Phone.normalize(dto.phone);
    await this.otp.verifyOtp(phone, dto.code, 'reset');

    const user = await this.db.user.findUnique({ where: { phone } });
    if (!user) {
      // Mavjud bo'lmagan raqam uchun ham bir xil umumiy xatolik
      throw BusinessException.badRequest(
        ErrorCode.OTP_INVALID,
        'Kod yaroqsiz yoki muddati tugagan',
        { attemptsLeft: 0 },
      );
    }

    await this.db.$transaction([
      this.db.user.update({
        where: { id: user.id },
        data: { password: await Crypt.hash(dto.password) },
      }),
      this.db.devices.deleteMany({ where: { userId: user.id } }),
    ]);

    return successRes({
      message: 'Parol yangilandi, barcha sessiyalar bekor qilindi',
    });
  }

  async signOut(refreshToken: string, res: Response) {
    if (refreshToken) {
      try {
        const verifiedData = await Token.verifyToken(refreshToken, 'refresh');
        await this.db.devices.delete({
          where: { deviceId: verifiedData.deviceId },
        });
      } catch (e) {
        // Token muddati o'tgan bo'lsa ham cookielarni tozalash
      }
    }
    Token.clearCookie(res);
    return successRes({ message: 'Tizimdan muvaffaqiyatli chiqildi' });
  }
}
