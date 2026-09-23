import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../config/database/prisma.service';
import { UpdateStoreDto } from './dto/update-store.dto';
import { CreateStoreDto } from './dto/create-store.dto';
import { OnboardStoreDto } from './dto/onboard-store.dto';
import { QueryStoreDto } from './dto/query-store.dto';
import { Crypt } from '../../infrastructure/lib/Crypt';
import { successRes } from '../../common/helper/success-response';
import { pageParams, paginate } from '../../common/helper/paginate';

/** Admin javobida parol kabi maxfiy maydonlar qaytmaydi */
const adminSelect = {
  id: true,
  fullName: true,
  name: true,
  phone: true,
  role: true,
  status: true,
  isActive: true,
  imageUrl: true,
  storeId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async getStore(storeId: number) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });
    if (!store) throw new NotFoundException("Do'kon topilmadi");
    return successRes(store);
  }

  async updateStore(storeId: number, dto: UpdateStoreDto) {
    await this.getStore(storeId);
    const store = await this.prisma.store.update({
      where: { id: storeId },
      data: dto,
    });
    return successRes(store);
  }

  /* ------------------------------- SUPERADMIN ------------------------------- */

  async findAll(query?: QueryStoreDto) {
    const { page, limit, skip, take } = pageParams(query);
    const where: Prisma.StoreWhereInput = {
      ...(query?.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
      ...(query?.isActive !== undefined ? { isActive: query.isActive } : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.store.count({ where }),
      this.prisma.store.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { users: true, products: true, sales: true } },
        },
        skip,
        take,
      }),
    ]);
    return successRes(paginate(items, total, { page, limit }));
  }

  async create(dto: CreateStoreDto) {
    const store = await this.prisma.store.create({ data: dto });
    return successRes(store, 201);
  }

  /**
   * Do'kon va uning ADMIN'ini bitta tranzaksiyada yaratadi.
   * Admin telefoni band bo'lsa 409 qaytadi va do'kon ham yaratilmaydi.
   */
  async onboard(dto: OnboardStoreDto) {
    const hashedPassword = await Crypt.hash(dto.admin.password);

    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { phone: dto.admin.phone },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException('Bu telefon raqami band');
      }

      const store = await tx.store.create({
        data: {
          name: dto.store.name,
          phone: dto.store.phone,
          address: dto.store.address,
        },
      });

      const admin = await tx.user.create({
        data: {
          fullName: dto.admin.fullName,
          phone: dto.admin.phone,
          password: hashedPassword,
          role: Role.ADMIN,
          storeId: store.id,
        },
        select: adminSelect,
      });

      return { store, admin };
    });

    return successRes(result, 201);
  }

  async remove(storeId: number) {
    await this.getStore(storeId);
    await this.prisma.store.delete({ where: { id: storeId } });
    return successRes({ message: "Do'kon o'chirildi", id: storeId });
  }
}
