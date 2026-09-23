import {
  ForbiddenException,
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
import { BusinessException } from '../../common/errors/business.exception';
import { ErrorCode } from '../../common/errors/error-codes';
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

      // Do'kon rahbari MANAGER rolida yaratiladi — har do'konda aynan bitta.
      const manager = await tx.user.create({
        data: {
          fullName: dto.admin.fullName,
          phone: dto.admin.phone,
          password: hashedPassword,
          role: Role.MANAGER,
          storeId: store.id,
        },
        select: adminSelect,
      });

      return { store, manager };
    });

    return successRes(result, 201);
  }

  /**
   * Menejerlikni boshqa xodimga o'tkazish (faqat SUPERADMIN).
   *
   * Eski meneger ADMIN bo'ladi, yangisi MANAGER — ikkalasi ham BITTA
   * tranzaksiyada, aks holda do'kon menejersiz yoki ikkita menejerli qolardi.
   * Baza darajasida ham kafolat bor: `User_storeId_manager_key` qisman indeksi.
   */
  async transferManager(storeId: number, userId: number) {
    await this.getStore(storeId);

    const result = await this.prisma.$transaction(async (tx) => {
      const next = await tx.user.findUnique({ where: { id: userId } });
      if (!next || next.storeId !== storeId) {
        throw BusinessException.notFound(
          ErrorCode.USER_NOT_FOUND,
          "Bu do'konda bunday xodim topilmadi",
        );
      }
      if (next.role === Role.MANAGER) {
        throw BusinessException.conflict(
          ErrorCode.MANAGER_ALREADY_EXISTS,
          'Bu xodim allaqachon meneger',
        );
      }
      if (next.role === Role.SUPERADMIN) {
        throw new ForbiddenException('SUPERADMIN meneger bo‘la olmaydi');
      }

      const current = await tx.user.findFirst({
        where: { storeId, role: Role.MANAGER },
      });

      // Avval eskisini tushiramiz — qisman unikal indeks ikkita MANAGER'ga yo'l qo'ymaydi.
      if (current) {
        await tx.user.update({
          where: { id: current.id },
          data: { role: Role.ADMIN },
        });
      }

      const manager = await tx.user.update({
        where: { id: userId },
        data: { role: Role.MANAGER },
        select: adminSelect,
      });

      return {
        manager,
        previousManagerId: current?.id ?? null,
      };
    });

    return successRes(result);
  }

  async remove(storeId: number) {
    await this.getStore(storeId);
    await this.prisma.store.delete({ where: { id: storeId } });
    return successRes({ message: "Do'kon o'chirildi", id: storeId });
  }
}
