import {
  Injectable,
  CanActivate,
  ExecutionContext,
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

    let storeId: string | null = user.storeId;
    if (user.role === Role.SUPERADMIN && req.headers['x-store-id']) {
      storeId = String(req.headers['x-store-id']);
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
