import { Role } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  storeId: string;
  role: Role;
  type: 'access' | 'refresh';
}
