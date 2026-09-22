import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/database/prisma.service';
import { successRes } from '../../common/helper/success-response';
import { Token } from '../../infrastructure/lib/Token';
import { env } from '../../config';
import { BusinessException } from '../../common/errors/business.exception';
import { ErrorCode } from '../../common/errors/error-codes';
import type { DeviceInfo } from '../../common/helper/device-info';

/** `GET /device` va qurilma limiti xatosida qaytadigan maydonlar */
export const deviceSelect = {
  deviceId: true,
  device: true,
  browser: true,
  os: true,
  deviceType: true,
  ip: true,
  createdAt: true,
  lastActiveAt: true,
} satisfies Prisma.DevicesSelect;

type DeviceRow = Prisma.DevicesGetPayload<{ select: typeof deviceSelect }>;

export interface DeviceView {
  deviceId: number;
  device: string;
  browser: string | null;
  os: string | null;
  deviceType: string | null;
  ip: string | null;
  createdAt: Date;
  lastActiveAt: Date;
  isCurrent: boolean;
  /** Qurilmani o'chirish mumkin bo'ladigan vaqt (ISO) */
  canRemoveAt: string;
}

@Injectable()
export class DeviceService {
  constructor(private readonly db: PrismaService) {}

  /**
   * Qurilmani o'chirish mumkin bo'ladigan payt.
   *
   * Qoida qurilmaning O'ZI yaratilgan vaqtga bog'langan (token `iat`ga emas):
   * refresh tokeni har rotatsiyada yangilanadi, shuning uchun `iat` asosidagi
   * hisob foydalanuvchi faol bo'lsa hech qachon 24 soatga yetmas edi.
   * Shu bilan birga har bir qurilma uchun alohida `canRemoveAt` berish
   * imkoni paydo bo'ladi (limit xatosidagi ro'yxat uchun zarur).
   */
  static canRemoveAt(device: { createdAt: Date }): Date {
    return new Date(
      device.createdAt.getTime() +
        env.DEVICE.REMOVAL_MIN_AGE_HOURS * 60 * 60 * 1000,
    );
  }

  static toView(device: DeviceRow, currentDeviceId?: number): DeviceView {
    return {
      ...device,
      isCurrent: device.deviceId === currentDeviceId,
      canRemoveAt: DeviceService.canRemoveAt(device).toISOString(),
    };
  }

  /** Foydalanuvchining barcha qurilmalari (limit xatosi uchun ham ishlatiladi) */
  async listForUser(
    userId: number,
    currentDeviceId?: number,
  ): Promise<DeviceView[]> {
    const devices = await this.db.devices.findMany({
      where: { userId },
      select: deviceSelect,
      orderBy: { lastActiveAt: 'desc' },
    });
    return devices.map((d) => DeviceService.toView(d, currentDeviceId));
  }

  async findAll(userId: number, currentDeviceId?: number) {
    return successRes(await this.listForUser(userId, currentDeviceId));
  }

  /** Qurilma yozuvini joriy so'rov ma'lumotlari bilan yangilaydi */
  async touch(deviceId: number, info?: DeviceInfo) {
    await this.db.devices.update({
      where: { deviceId },
      data: {
        lastActiveAt: new Date(),
        ...(info
          ? {
              device: info.device,
              browser: info.browser,
              os: info.os,
              deviceType: info.deviceType,
              ip: info.ip,
            }
          : {}),
      },
    });
  }

  async remove(refreshToken: string, id: number) {
    if (!refreshToken) {
      throw BusinessException.unauthorized(
        ErrorCode.REFRESH_TOKEN_MISSING,
        'Sessiya topilmadi. Qaytadan tizimga kiring',
      );
    }
    const verifiedData = await Token.verifyToken(refreshToken, 'refresh');

    if (verifiedData.deviceId === id) {
      throw BusinessException.badRequest(
        ErrorCode.DEVICE_CURRENT_CANNOT_BE_REMOVED,
        "Joriy qurilmani o'chirib bo'lmaydi",
      );
    }

    const device = await this.db.devices.findFirst({
      where: { deviceId: id, userId: verifiedData.sub },
      select: { ...deviceSelect, userId: true },
    });
    if (!device) {
      throw BusinessException.notFound(
        ErrorCode.DEVICE_NOT_FOUND,
        'Qurilma topilmadi',
      );
    }

    const canRemoveAt = DeviceService.canRemoveAt(device);
    if (canRemoveAt > new Date()) {
      throw BusinessException.badRequest(
        ErrorCode.DEVICE_REMOVAL_TOO_EARLY,
        `Qurilmani o'chirish uchun u qo'shilgandan so'ng ${env.DEVICE.REMOVAL_MIN_AGE_HOURS} soat o'tishi kerak`,
        { canRemoveAt: canRemoveAt.toISOString() },
      );
    }

    await this.db.devices.delete({ where: { deviceId: id } });
    return successRes({ message: "Qurilma o'chirildi", deviceId: id });
  }
}
