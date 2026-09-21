import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';
import { env } from '../index';
import { Crypt } from '../../infrastructure/lib/Crypt';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const adapter = new PrismaPg({
      connectionString: env.DB_URI,
    });
    super({
      adapter,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Database connected');

    const isSuperAdmin = await this.user.findFirst({
      where: {
        role: Role.SUPERADMIN,
      },
    });
    if (!isSuperAdmin) {
      await this.user.create({
        data: {
          phone: env.SUPERADMIN.PHONE,
          password: await Crypt.hash(env.SUPERADMIN.PASSWORD),
          role: Role.SUPERADMIN,
          fullName: 'Super Administrator',
        },
      });
      this.logger.log('Super admin created');
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }
}
