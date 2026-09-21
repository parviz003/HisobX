import { createParamDecorator, ExecutionContext } from '@nestjs/common';
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
