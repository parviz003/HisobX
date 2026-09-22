import {
  NotFoundException,
  BadRequestException,
  Injectable,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../config/database/prisma.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Crypt } from '../../infrastructure/lib/Crypt';
import { successRes } from '../../common/helper/success-response';
import { OtpService } from '../otp/otp.service';
import { VerifyOTPDto } from '../otp/dto/verify-otp.dto';
import { Token } from '../../infrastructure/lib/Token';
import type { Response, Request } from 'express';
import { getDeviceInfo } from '../../common/helper/device-info';
import { Role, Status } from '@prisma/client';

const MAX_DEVICES = 3;

@Injectable()
export class AuthService {
  constructor(
    private readonly db: PrismaService,
    private readonly otp: OtpService,
  ) {}

  async signUp(dto: SignUpDto) {
    const existing = await this.db.user.findUnique({
      where: { phone: dto.phone },
    });
    if (existing) {
      throw new ConflictException('Bu telefon raqam allaqachon mavjud');
    }

    const hashedPassword = await Crypt.hash(dto.password);

    const result = await this.db.$transaction(async (tx) => {
      const store = await tx.store.create({
        data: {
          name: dto.storeName,
          phone: dto.phone,
        },
      });

      const user = await tx.user.create({
        data: {
          phone: dto.phone,
          password: hashedPassword,
          fullName: dto.fullName,
          role: Role.ADMIN,
          storeId: store.id,
        },
      });

      return { store, user };
    });

    return successRes(
      {
        message: "Do'kon va administrator muvaffaqiyatli yaratildi",
        storeId: result.store.id,
        userId: result.user.id,
      },
      201,
    );
  }

  async signIn(dto: SignInDto) {
    const user = await this.db.user.findUnique({
      where: { phone: dto.phone },
    });
    const isMatchPass = await Crypt.compare(
      dto.password,
      user ? user.password : '',
    );
    if (!isMatchPass || !user) {
      throw new BadRequestException('Telefon raqam yoki parol xato');
    }
    if (!user.isActive || user.status !== Status.ACTIVE) {
      throw new ForbiddenException('Hisobingiz faol emas');
    }

    const data = await this.otp.sendOtp(user.phone, 'signin');
    await this.otp.markPending(user.phone, 'signin');
    return successRes(data, 200);
  }

  async confirmSignIn(dto: VerifyOTPDto, req: Request, res: Response) {
    const user = await this.db.user.findUnique({ where: { phone: dto.phone } });
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }
    if (!user.isActive || user.status !== Status.ACTIVE) {
      throw new ForbiddenException('Hisobingiz faol emas');
    }

    // OTP faqat parol tekshiruvidan o'tgan signIn urinishi uchun tasdiqlanadi
    await this.otp.verifyOtp(user.phone, dto.code, 'signin');
    await this.otp.consumePending(user.phone, 'signin');

    const { client, os } = getDeviceInfo(req);
    const deviceName = `${client?.name || 'Browser'} ${os?.name || 'Device'}`;

    // Bir xil qurilmadan qayta kirilsa yangi sessiya ochilmaydi, eskisi yangilanadi
    let device = await this.db.devices.findFirst({
      where: { userId: user.id, device: deviceName },
    });

    if (!device) {
      const deviceCount = await this.db.devices.count({
        where: { userId: user.id },
      });
      if (deviceCount >= MAX_DEVICES) {
        throw new ForbiddenException(
          `Qurilmalar soni ${MAX_DEVICES} tadan oshishi taqiqlanadi. Avval eski qurilmalarni o\u2018chiring.`,
        );
      }
      device = await this.db.devices.create({
        data: {
          userId: user.id,
          device: deviceName,
          hashedRefreshToken: '',
        },
      });
    }

    const payload = {
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
      data: { hashedRefreshToken },
    });

    Token.setCookie(res, accessToken, refreshToken);

    return successRes(
      {
        userId: device.userId,
        deviceId: device.deviceId,
        device: device.device,
        role: user.role,
        storeId: user.storeId,
        createdAt: device.createdAt,
      },
      200,
    );
  }

  async refreshToken(refreshToken: string, res: Response) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token topilmadi');
    }
    const verifiedData = await Token.verifyToken(refreshToken, 'refresh');
    const device = await this.db.devices.findUnique({
      where: { deviceId: verifiedData.deviceId },
    });
    if (!device) {
      throw new BadRequestException(
        'Tizimda bunday foydalanuvchi yoki qurilma topilmadi',
      );
    }
    const isMatchToken = Crypt.compareToken(
      refreshToken,
      device.hashedRefreshToken,
    );
    if (!isMatchToken) {
      throw new BadRequestException("Qurilma tizimda ro'yxatdan o'tmagan");
    }

    const user = await this.db.user.findUnique({ where: { id: device.userId } });
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }
    if (!user.isActive || user.status !== Status.ACTIVE) {
      throw new ForbiddenException('Hisobingiz faol emas');
    }

    // Token payloadi bazadagi dolzarb ma'lumot asosida qayta quriladi
    const payload = {
      sub: user.id,
      role: user.role,
      status: user.status,
      deviceId: device.deviceId,
      storeId: user.storeId,
    };

    const tokens = await Token.getToken(payload);

    // Refresh token rotatsiyasi: eski token bekor qilinadi
    await this.db.devices.update({
      where: { deviceId: device.deviceId },
      data: { hashedRefreshToken: Crypt.hashToken(tokens.refreshToken) },
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
  async resendSignInOtp(phone: string) {
    await this.otp.assertPending(phone, 'signin');
    const data = await this.otp.sendOtp(phone, 'signin');
    // Muddat cho'zilganda urinish belgisi ham yangilanadi
    await this.otp.markPending(phone, 'signin');
    return successRes(data, 200);
  }

  /**
   * Parolni tiklash uchun OTP.
   * Raqam bazada bor-yo'qligidan qat'i nazar javob bir xil bo'ladi.
   */
  async forgotPassword(phone: string) {
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
    await this.otp.verifyOtp(dto.phone, dto.code, 'reset');

    const user = await this.db.user.findUnique({
      where: { phone: dto.phone },
    });
    if (!user) {
      // Mavjud bo'lmagan raqam uchun ham bir xil umumiy xatolik
      throw new BadRequestException(
        'Kod yaroqsiz yoki muddati tugagan',
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
      message: "Parol yangilandi, barcha sessiyalar bekor qilindi",
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
