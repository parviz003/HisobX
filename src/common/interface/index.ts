import { Role, Status } from '@prisma/client';

export interface IPayload {
  sub: string;
  role: Role;
  status: Status;
  deviceId?: string;
  storeId?: string | null;
}

export interface IToken {
  accessToken: string;
  refreshToken: string;
}

export interface ISuccess<T = any> {
  statusCode: number;
  data: T;
}
