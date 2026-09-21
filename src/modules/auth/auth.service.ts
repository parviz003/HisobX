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
import { Crypt } from '../../infrastructure/lib/Crypt';
import { successRes } from '../../common/helper/success-response';
import { OtpService } from '../otp/otp.service';
import { VerifyOTPDto } from '../otp/dto/verify-otp.dto';
import { Token } from '../../infrastructure/lib/Token';
import type { Response, Request } from 'express';
import { getDeviceInfo } from '../../common/helper/device-info';
import { Role } from '@prisma/client';

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
    if (!user.isActive) {
      throw new ForbiddenException('Hisobingiz faol emas');
    }

    const data = await this.otp.sendOtp(user.phone);
    return successRes(data, 200);
  }

  async confirmSignIn(dto: VerifyOTPDto, req: Request, res: Response) {
    const user = await this.db.user.findUnique({ where: { phone: dto.phone } });
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }
    await this.otp.verifyOtp(user.phone, dto.code);

    const devices = await this.db.devices.findMany({
      where: { userId: user.id },
    });
    if (devices.length >= 3) {
      throw new ForbiddenException(
        'Qurilmalar soni 3 tadan oshishi taqiqlanadi. Avval eski qurilmalarni o‘chiring.',
      );
    }

    const { client, os } = getDeviceInfo(req);
    const device = await this.db.devices.create({
      data: {
        userId: user.id,
        device: `${client?.name || 'Browser'} ${os?.name || 'Device'}`,
        hashedRefreshToken: '',
      },
    });

    const payload = {
      sub: user.id,
      role: user.role,
      status: user.status,
      deviceId: device.deviceId,
      storeId: user.storeId,
    };

    const { accessToken, refreshToken } = await Token.getToken(payload);
    const hashedRefreshToken = await Crypt.hash(refreshToken);

    await this.db.devices.update({
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
    const isMatchToken = await Crypt.compare(
      refreshToken,
      device.hashedRefreshToken,
    );
    if (!isMatchToken) {
      throw new BadRequestException("Qurilma tizimda ro'yxatdan o'tmagan");
    }

    delete verifiedData.iat;
    delete verifiedData.exp;

    const { accessToken } = await Token.getToken(verifiedData);
    Token.setCookie(res, accessToken);

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
