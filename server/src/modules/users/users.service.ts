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
      select: {
        ...userSelect,
        telegramChatId: true,
        store: { select: { id: true, name: true } },
      },
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

    // Chat IDsi tashqariga chiqmaydi — faqat ulangan-ulanmagani ko'rinadi.
    const { telegramChatId, ...profile } = user;
    return successRes({ ...profile, telegramLinked: Boolean(telegramChatId) });
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
   * Ruxsatlar matritsasi (topshiriq 1-bo'lim):
   *   MANAGER    — o'z do'konidagi ADMIN va SELLER'lar
   *   ADMIN      — faqat o'z do'konidagi SELLER'lar
   *   SUPERADMIN — barcha do'konlar
   *
   * Ko'rinmasligi kerak bo'lgan hisob 404, ko'rinsa-yu huquq yetmasa 403 beradi.
   * MANAGER rolini bu endpointlar orqali BERIB BO'LMAYDI — meneger do'kon
   * ochilganda yaratiladi yoki `PATCH /stores/:id/manager` bilan o'tkaziladi.
   */

  /** Aktyor qaysi rollardagi xodimlarni boshqara oladi. */
  private manageableRoles(actorRole: Role): Role[] {
    if (actorRole === Role.MANAGER) return [Role.ADMIN, Role.SELLER];
    return [Role.SELLER];
  }

  async findAll(actor: IPayload, query: QueryUserDto) {
    const targetStoreId =
      actor.role === Role.SUPERADMIN
        ? actor.storeId || query.storeId
        : actor.storeId;

    const allowedRoles =
      actor.role === Role.SUPERADMIN
        ? undefined
        : this.manageableRoles(actor.role);

    const where: Prisma.UserWhereInput = {
      ...(targetStoreId ? { storeId: targetStoreId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(actor.role === Role.SUPERADMIN
        ? query.role
          ? { role: query.role }
          : {}
        : {
            role: query.role
              ? allowedRoles!.includes(query.role)
                ? query.role
                : Role.SUPERADMIN // mos kelmaydigan filtr -> bo'sh natija
              : { in: allowedRoles },
          }),
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
    if (dto.role === Role.MANAGER) {
      throw new ForbiddenException(
        "MANAGER bu endpoint orqali yaratilmaydi — do'kon ochilganda yoki " +
          'menejerlikni o‘tkazish orqali belgilanadi',
      );
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
      // Do'kon xodimi faqat o'z do'koniga va faqat ruxsat etilgan rolda qo'shadi
      if (!this.manageableRoles(actor.role).includes(dto.role)) {
        throw new ForbiddenException(
          actor.role === Role.MANAGER
            ? 'MANAGER faqat ADMIN yoki SELLER qo‘sha oladi'
            : 'ADMIN faqat SELLER rolidagi xodim qo‘sha oladi',
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
      if (dto.role === Role.SUPERADMIN || dto.role === Role.MANAGER) {
        throw new ForbiddenException(
          `${dto.role} roli bu endpoint orqali berilmaydi`,
        );
      }
      if (
        actor.role !== Role.SUPERADMIN &&
        !this.manageableRoles(actor.role).includes(dto.role)
      ) {
        throw new ForbiddenException('Bu rolni belgilashga ruxsat yo‘q');
      }
    }

    // MANAGER o'zini bloklay olmaydi va o'z rolini o'zgartira olmaydi
    if ((dto.status || dto.role) && id === actor.sub) {
      throw new ForbiddenException(
        "O'z hisobingizning roli yoki holatini o'zgartira olmaysiz",
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

    // Boshqa do'kon xodimi umuman ko'rinmaydi
    if (!actor.storeId || user.storeId !== actor.storeId) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }
    // MANAGER -> ADMIN va SELLER, ADMIN -> faqat SELLER.
    // Menejerning o'z hisobi bu yerdan boshqarilmaydi (o'zini bloklay olmaydi).
    if (!this.manageableRoles(actor.role).includes(user.role)) {
      throw new ForbiddenException(
        actor.role === Role.MANAGER
          ? 'Faqat ADMIN va SELLER xodimlarni boshqarish mumkin'
          : 'Faqat SELLER rolidagi xodimlarni boshqarish mumkin',
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
