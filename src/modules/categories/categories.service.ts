import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../config/database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: string, createCategoryDto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: {
        storeId_name: {
          storeId,
          name: createCategoryDto.name,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }

    return this.prisma.category.create({
      data: {
        ...createCategoryDto,
        storeId,
      },
    });
  }

  async findAll(storeId: string) {
    return this.prisma.category.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    storeId: string,
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ) {
    const category = await this.prisma.category.findFirst({
      where: { id, storeId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existing = await this.prisma.category.findUnique({
        where: {
          storeId_name: {
            storeId,
            name: updateCategoryDto.name,
          },
        },
      });

      if (existing) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async remove(storeId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, storeId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }
}
