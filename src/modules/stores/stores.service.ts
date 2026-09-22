import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/database/prisma.service';
import { UpdateStoreDto } from './dto/update-store.dto';
import { CreateStoreDto } from './dto/create-store.dto';
import { successRes } from '../../common/helper/success-response';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async getStore(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });
    if (!store) throw new NotFoundException("Do'kon topilmadi");
    return successRes(store);
  }

  async updateStore(storeId: string, dto: UpdateStoreDto) {
    await this.getStore(storeId);
    const store = await this.prisma.store.update({
      where: { id: storeId },
      data: dto,
    });
    return successRes(store);
  }

  /* ------------------------------- SUPERADMIN ------------------------------- */

  async findAll() {
    const stores = await this.prisma.store.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { users: true, products: true, sales: true } },
      },
    });
    return successRes(stores);
  }

  async create(dto: CreateStoreDto) {
    const store = await this.prisma.store.create({ data: dto });
    return successRes(store, 201);
  }

  async remove(storeId: string) {
    await this.getStore(storeId);
    await this.prisma.store.delete({ where: { id: storeId } });
    return successRes({ message: "Do'kon o'chirildi", id: storeId });
  }
}
