import { Role, Status } from '@prisma/client';

export interface IPayload {
  sub: number;
  role: Role;
  status: Status;
  deviceId?: number;
  storeId?: number | null;
}

export interface IToken {
  accessToken: string;
  refreshToken: string;
}

export interface ISuccess<T = any> {
  statusCode: number;
  data: T;
}
