import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, Status } from '@prisma/client';
import { Token } from '../../infrastructure/lib/Token';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PrismaService } from '../../config/database/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly storeContextLogger = new Logger('StoreContext');

  constructor(
    private readonly reflector: Reflector,
    private readonly db: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const accessToken = req.cookies?.accessToken;
    if (!accessToken) {
      throw new UnauthorizedException(
        'Tizimga kirishda nosozlik: Token topilmadi',
      );
    }

    const data = await Token.verifyToken(accessToken, 'access');
    if (!data?.sub || !data?.role) {
      throw new UnauthorizedException(
        'Tizimga kirishda nosozlik: Token yaroqsiz',
      );
    }

    const user = await this.db.user.findUnique({
      where: { id: data.sub },
      select: {
        id: true,
        role: true,
        status: true,
        isActive: true,
        storeId: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('Foydalanuvchi topilmadi');
    }
    if (!user.isActive || user.status !== Status.ACTIVE) {
      throw new ForbiddenException('Hisobingiz faol emas');
    }

    if (data.deviceId) {
      const device = await this.db.devices.findUnique({
        where: { deviceId: data.deviceId },
        select: { deviceId: true, userId: true },
      });
      if (!device || device.userId !== user.id) {
        throw new UnauthorizedException(
          'Sessiya tugagan. Qaytadan tizimga kiring',
        );
      }
    }

    /*
     * Multi-tenant himoya:
     * ADMIN va SELLER uchun storeId FAQAT bazadagi hisobdan olinadi —
     * ular yuborgan `x-store-id` header butunlay e'tiborsiz qoldiriladi.
     * SUPERADMIN `x-store-id` bilan do'kon kontekstiga kirishi mumkin,
     * ammo u kontekstda faqat o'qish (GET) amallari ruxsat etiladi.
     */
    let storeId: number | null = user.storeId;
    const storeIdHeader = req.headers['x-store-id'];

    if (storeIdHeader && user.role === Role.SUPERADMIN) {
      const parsedStoreId = Number(storeIdHeader);
      if (!Number.isInteger(parsedStoreId) || parsedStoreId <= 0) {
        throw new ForbiddenException(
          "'x-store-id' header butun son bo'lishi kerak",
        );
      }
      storeId = parsedStoreId;
      const method = String(req.method).toUpperCase();

      this.storeContextLogger.log(
        `userId=${user.id} storeId=${storeId} ${method} ` +
          `${req.originalUrl ?? req.url} ip=${req.ip} at=${new Date().toISOString()}`,
      );

      if (method !== 'GET') {
        throw new ForbiddenException(
          "Do'kon kontekstida (x-store-id) faqat o'qish amallari ruxsat etiladi",
        );
      }
    }

    req.user = {
      sub: user.id,
      role: user.role,
      status: user.status,
      deviceId: data.deviceId,
      storeId,
    };
    return true;
  }
}
