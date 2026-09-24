import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { IPayload } from '../interface';

export const CurrentUser = createParamDecorator(
  (data: keyof IPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as IPayload;
    return data ? user?.[data] : user;
  },
);

export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.sub;
  },
);

export const StoreId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest();
    const storeId = request.user?.storeId;
    if (!storeId) {
      throw new BadRequestException(
        "Do'kon aniqlanmadi. SUPERADMIN uchun 'x-store-id' headerini yuboring",
      );
    }
    return storeId;
  },
);
