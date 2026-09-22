import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, Status } from '@prisma/client';
import { PrismaService } from '../../config/database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { Crypt } from '../../infrastructure/lib/Crypt';
import { File } from '../../infrastructure/lib/File';
import { successRes } from '../../common/helper/success-response';
import { IPayload } from '../../common/interface';
import 'multer';

const userSelect = {
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
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /* ----------------------------- PROFIL (o'zi) ---------------------------- */

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { ...userSelect, store: { select: { id: true, name: true } } },
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    return successRes(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

    await this.ensurePhoneFree(dto.phone, userId);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        ...(dto.password ? { password: await Crypt.hash(dto.password) } : {}),
      },
      select: userSelect,
    });
    return successRes(updated);
  }

  /** Yangi rasm yuklanganda eskisi diskdan o'chiriladi */
  async updateProfileImage(userId: string, image?: Express.Multer.File) {
    if (!image) {
      throw new BadRequestException("Rasm yuborilmadi ('image' maydoni)");
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

    const imageUrl = await File.create(image);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { imageUrl },
      select: userSelect,
    });

    if (user.imageUrl && user.imageUrl !== imageUrl) {
      await File.delete(user.imageUrl);
    }

    return successRes(updated);
  }

  async removeProfileImage(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    if (!user.imageUrl) {
      throw new BadRequestException('Profil rasmi mavjud emas');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { imageUrl: null },
      select: userSelect,
    });
    await File.delete(user.imageUrl);

    return successRes(updated);
  }

  /* --------------------------- XODIMLAR BOSHQARUVI --------------------------- */
  /*
   * ADMIN  — faqat o'z do'konidagi SELLER'lar (boshqa do'kon xodimi ko'rinmaydi: 404,
   *          ADMIN/SUPERADMIN hisobiga tegish taqiqlanadi: 403)
   * SUPERADMIN — barcha do'konlar va ADMIN'lar
   */

  async findAll(actor: IPayload, query: QueryUserDto) {
    const where: Prisma.UserWhereInput =
      actor.role === Role.SUPERADMIN
        ? {
            ...(query.storeId ? { storeId: query.storeId } : {}),
            ...(query.role ? { role: query.role } : {}),
            ...(query.status ? { status: query.status } : {}),
          }
        : {
            // ADMIN uchun storeId har doim o'z do'koni, role har doim SELLER
            storeId: actor.storeId,
            role: Role.SELLER,
            ...(query.status ? { status: query.status } : {}),
          };

    const users = await this.prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: { createdAt: 'desc' },
    });
    return successRes(users);
  }

  async findOne(actor: IPayload, id: string) {
    const user = await this.loadManageableUser(actor, id, {
      store: { select: { id: true, name: true } },
    });
    return successRes(user);
  }

  async create(actor: IPayload, dto: CreateUserDto) {
    if (dto.role === Role.SUPERADMIN) {
      throw new ForbiddenException('SUPERADMIN yaratish taqiqlanadi');
    }

    let storeId: string | undefined;

    if (actor.role === Role.SUPERADMIN) {
      if (dto.storeId) {
        const store = await this.prisma.store.findUnique({
          where: { id: dto.storeId },
        });
        if (!store) throw new NotFoundException("Do'kon topilmadi");
        storeId = store.id;
      } else if (dto.role === Role.ADMIN && dto.storeName) {
        const store = await this.prisma.store.create({
          data: { name: dto.storeName, phone: dto.phone },
        });
        storeId = store.id;
      } else {
        throw new BadRequestException(
          "storeId yoki (ADMIN uchun) storeName ko'rsatilishi shart",
        );
      }
    } else {
      // ADMIN: faqat o'z do'koni va faqat SELLER
      if (dto.role !== Role.SELLER) {
        throw new ForbiddenException(
          'ADMIN faqat SELLER rolidagi xodim qo‘sha oladi',
        );
      }
      if (!actor.storeId) {
        throw new BadRequestException("Do'kon aniqlanmadi");
      }
      storeId = actor.storeId;
    }

    await this.ensurePhoneFree(dto.phone);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        password: await Crypt.hash(dto.password),
        role: dto.role,
        storeId,
      },
      select: userSelect,
    });
    return successRes(user, 201);
  }

  async update(actor: IPayload, id: string, dto: UpdateUserDto) {
    const user = await this.loadManageableUser(actor, id);

    if (dto.role) {
      if (dto.role === Role.SUPERADMIN) {
        throw new ForbiddenException('SUPERADMIN roli berilishi taqiqlanadi');
      }
      if (actor.role !== Role.SUPERADMIN && dto.role !== Role.SELLER) {
        throw new ForbiddenException(
          'ADMIN rolni faqat SELLER qilib belgilashi mumkin',
        );
      }
    }

    if (dto.status && id === actor.sub) {
      throw new ForbiddenException("O'z hisobingiz holatini o'zgartira olmaysiz");
    }

    await this.ensurePhoneFree(dto.phone, id);

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        role: dto.role,
        ...(dto.status
          ? { status: dto.status, isActive: dto.status === Status.ACTIVE }
          : {}),
      },
      select: userSelect,
    });

    // Bloklangan xodimning barcha qurilma sessiyalari darhol bekor qilinadi
    if (dto.status === Status.INACTIVE) {
      await this.prisma.devices.deleteMany({ where: { userId: id } });
    }

    return successRes(updated);
  }

  /** Xodim parolini tiklash — barcha sessiyalari bekor qilinadi */
  async resetPassword(actor: IPayload, id: string, password: string) {
    await this.loadManageableUser(actor, id);

    const updated = await this.prisma.user.update({
      where: { id },
      data: { password: await Crypt.hash(password) },
      select: userSelect,
    });
    await this.prisma.devices.deleteMany({ where: { userId: id } });

    return successRes({
      ...updated,
      message: "Parol tiklandi, barcha sessiyalar bekor qilindi",
    });
  }

  async remove(actor: IPayload, id: string) {
    const user = await this.loadManageableUser(actor, id);
    if (id === actor.sub) {
      throw new ForbiddenException("O'z hisobingizni o'chira olmaysiz");
    }

    await this.prisma.user.delete({ where: { id } });
    if (user.imageUrl) {
      await File.delete(user.imageUrl);
    }

    return successRes({ message: "Foydalanuvchi o'chirildi", id });
  }

  /**
   * Aktyor boshqarishi mumkin bo'lgan foydalanuvchini yuklaydi.
   * Ko'rinmasligi kerak bo'lgan hisob — 404, ko'rinsa-yu huquq yetmasa — 403.
   */
  private async loadManageableUser(
    actor: IPayload,
    id: string,
    include: Prisma.UserSelect = {},
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { ...userSelect, ...include },
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

    if (actor.role === Role.SUPERADMIN) {
      if (user.role === Role.SUPERADMIN) {
        throw new ForbiddenException(
          "SUPERADMIN hisobini bu endpoint orqali boshqarib bo'lmaydi",
        );
      }
      return user;
    }

    // ADMIN: boshqa do'kon xodimi umuman ko'rinmaydi
    if (!actor.storeId || user.storeId !== actor.storeId) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }
    // O'z do'konidagi ADMIN/SUPERADMIN hisobiga tegib bo'lmaydi
    if (user.role !== Role.SELLER) {
      throw new ForbiddenException(
        'Faqat SELLER rolidagi xodimlarni boshqarish mumkin',
      );
    }
    return user;
  }

  private async ensurePhoneFree(phone?: string, exceptUserId?: string) {
    if (!phone) return;
    const existing = await this.prisma.user.findUnique({ where: { phone } });
    if (existing && existing.id !== exceptUserId) {
      throw new ConflictException('Bu telefon raqami band');
    }
  }
}
