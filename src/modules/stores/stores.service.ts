import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/database/prisma.service';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async getStore(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });
    if (!store) throw new NotFoundException("Do'kon topilmadi");
    return store;
  }

  async updateStore(storeId: string, dto: UpdateStoreDto) {
    await this.getStore(storeId);
    return this.prisma.store.update({
      where: { id: storeId },
      data: dto,
    });
  }
}
