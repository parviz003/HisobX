import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Token } from '../../infrastructure/lib/Token';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

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
    if (!data) {
      throw new UnauthorizedException(
        'Tizimga kirishda nosozlik: Token yaroqsiz',
      );
    }

    req.user = {
      sub: data.sub,
      role: data.role,
      status: data.status,
      deviceId: data.deviceId,
      storeId: data.storeId,
    };
    return true;
  }
}
