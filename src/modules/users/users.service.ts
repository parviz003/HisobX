import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../config/database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Crypt } from '../../infrastructure/lib/Crypt';
import { File } from '../../infrastructure/lib/File';
import { successRes } from '../../common/helper/success-response';
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

  /* --------------------------- SUPERADMIN boshqaruvi --------------------------- */

  async findAll(storeId?: string, role?: Role) {
    const users = await this.prisma.user.findMany({
      where: {
        ...(storeId ? { storeId } : {}),
        ...(role ? { role } : {}),
      },
      select: userSelect,
      orderBy: { createdAt: 'desc' },
    });
    return successRes(users);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { ...userSelect, store: { select: { id: true, name: true } } },
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    return successRes(user);
  }

  async create(dto: CreateUserDto) {
    if (dto.role === Role.SUPERADMIN) {
      throw new ForbiddenException('SUPERADMIN yaratish taqiqlanadi');
    }
    await this.ensurePhoneFree(dto.phone);

    let storeId = dto.storeId;
    if (storeId) {
      const store = await this.prisma.store.findUnique({
        where: { id: storeId },
      });
      if (!store) throw new NotFoundException("Do'kon topilmadi");
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

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    if (user.role === Role.SUPERADMIN) {
      throw new ForbiddenException(
        "SUPERADMIN hisobini bu endpoint orqali o'zgartirib bo'lmaydi",
      );
    }
    if (dto.role === Role.SUPERADMIN) {
      throw new ForbiddenException('SUPERADMIN roli berilishi taqiqlanadi');
    }
    await this.ensurePhoneFree(dto.phone, id);

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        role: dto.role,
        status: dto.status,
        isActive: dto.isActive,
        ...(dto.password ? { password: await Crypt.hash(dto.password) } : {}),
      },
      select: userSelect,
    });

    // Bloklangan foydalanuvchining barcha sessiyalari yopiladi
    if (dto.isActive === false || dto.status === 'INACTIVE') {
      await this.prisma.devices.deleteMany({ where: { userId: id } });
    }

    return successRes(updated);
  }

  async remove(id: string, currentUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    if (user.role === Role.SUPERADMIN) {
      throw new ForbiddenException("SUPERADMIN hisobini o'chirib bo'lmaydi");
    }
    if (id === currentUserId) {
      throw new ForbiddenException("O'z hisobingizni o'chira olmaysiz");
    }

    await this.prisma.user.delete({ where: { id } });
    if (user.imageUrl) {
      await File.delete(user.imageUrl);
    }

    return successRes({ message: "Foydalanuvchi o'chirildi", id });
  }

  private async ensurePhoneFree(phone?: string, exceptUserId?: string) {
    if (!phone) return;
    const existing = await this.prisma.user.findUnique({ where: { phone } });
    if (existing && existing.id !== exceptUserId) {
      throw new ConflictException('Bu telefon raqami band');
    }
  }
}
