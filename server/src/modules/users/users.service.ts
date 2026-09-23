import {
  BadRequestException,
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
import { ChangePasswordDto } from './dto/change-password.dto';
import { BusinessException } from '../../common/errors/business.exception';
import { ErrorCode } from '../../common/errors/error-codes';
import { Phone } from '../../common/helper/phone';
import 'multer';
import { pageParams, paginate } from '../../common/helper/paginate';

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

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { ...userSelect, store: { select: { id: true, name: true } } },
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    return successRes(user);
  }

  /** Faqat `fullName`. Telefon va parol bu yerdan o'zgarmaydi (xavfsizlik). */
  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { fullName: dto.fullName },
      select: userSelect,
    });
    return successRes(updated);
  }

  /**
   * Parolni almashtirish.
   *
   * Joriy parol tasdiqlanadi (`WRONG_PASSWORD`), so'ng JORIY QURILMADAN
   * TASHQARI barcha sessiyalar bekor qilinadi — parol o'g'irlangan bo'lsa,
   * o'g'ri darhol chiqarib yuboriladi, egasi esa tizimda qoladi.
   */
  async changePassword(
    userId: number,
    currentDeviceId: number | undefined,
    dto: ChangePasswordDto,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

    const isMatch = await Crypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw BusinessException.badRequest(
        ErrorCode.WRONG_PASSWORD,
        "Joriy parol noto'g'ri",
      );
    }

    const [, revoked] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { password: await Crypt.hash(dto.newPassword) },
      }),
      this.prisma.devices.deleteMany({
        where: {
          userId,
          ...(currentDeviceId ? { deviceId: { not: currentDeviceId } } : {}),
        },
      }),
    ]);

    return successRes({
      message:
        'Parol yangilandi. Joriy qurilmadan tashqari barcha sessiyalar bekor qilindi',
      revokedSessions: revoked.count,
    });
  }

  /** Yangi rasm yuklanganda eskisi diskdan o'chiriladi */
  async updateProfileImage(userId: number, image?: Express.Multer.File) {
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

  async removeProfileImage(userId: number) {
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

    const { page, limit, skip, take } = pageParams(query);
    const [total, items] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: userSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);
    return successRes(paginate(items, total, { page, limit }));
  }

  async findOne(actor: IPayload, id: number) {
    const user = await this.loadManageableUser(actor, id, {
      store: { select: { id: true, name: true } },
    });
    return successRes(user);
  }

  async create(actor: IPayload, dto: CreateUserDto) {
    if (dto.role === Role.SUPERADMIN) {
      throw new ForbiddenException('SUPERADMIN yaratish taqiqlanadi');
    }

    let storeId: number | undefined;

    if (actor.role === Role.SUPERADMIN) {
      if (!dto.storeId) {
        throw new BadRequestException("storeId ko'rsatilishi shart");
      }
      const store = await this.prisma.store.findUnique({
        where: { id: dto.storeId },
      });
      if (!store) throw new NotFoundException("Do'kon topilmadi");
      if (!store.isActive) {
        throw new BadRequestException("Do'kon faol emas");
      }
      storeId = store.id;
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

    const phone = Phone.normalize(dto.phone);
    await this.ensurePhoneFree(phone);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        phone,
        password: await Crypt.hash(dto.password),
        role: dto.role,
        storeId,
      },
      select: userSelect,
    });
    return successRes(user, 201);
  }

  async update(actor: IPayload, id: number, dto: UpdateUserDto) {
    // Ruxsat tekshiruvi: ko'rinmasligi kerak bo'lgan hisob uchun 404/403 qaytaradi
    await this.loadManageableUser(actor, id);

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
      throw new ForbiddenException(
        "O'z hisobingiz holatini o'zgartira olmaysiz",
      );
    }

    const phone = dto.phone ? Phone.normalize(dto.phone) : undefined;
    await this.ensurePhoneFree(phone, id);

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        fullName: dto.fullName,
        phone,
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
  async resetPassword(actor: IPayload, id: number, password: string) {
    await this.loadManageableUser(actor, id);

    const updated = await this.prisma.user.update({
      where: { id },
      data: { password: await Crypt.hash(password) },
      select: userSelect,
    });
    await this.prisma.devices.deleteMany({ where: { userId: id } });

    return successRes({
      ...updated,
      message: 'Parol tiklandi, barcha sessiyalar bekor qilindi',
    });
  }

  async remove(actor: IPayload, id: number) {
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
    id: number,
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

  private async ensurePhoneFree(phone?: string, exceptUserId?: number) {
    if (!phone) return;
    const existing = await this.prisma.user.findUnique({
      where: { phone: Phone.normalize(phone) },
    });
    if (existing && existing.id !== exceptUserId) {
      throw BusinessException.conflict(
        ErrorCode.PHONE_TAKEN,
        'Bu telefon raqami band',
      );
    }
  }
}
