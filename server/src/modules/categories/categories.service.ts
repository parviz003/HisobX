import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../config/database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { successRes } from '../../common/helper/success-response';
import { pageParams, paginate } from '../../common/helper/paginate';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: number, createCategoryDto: CreateCategoryDto) {
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

    const category = await this.prisma.category.create({
      data: {
        ...createCategoryDto,
        storeId,
      },
    });
    return successRes(category, 201);
  }

  async findAll(storeId: number, query?: QueryCategoryDto) {
    const { page, limit, skip, take } = pageParams(query);
    const where: Prisma.CategoryWhereInput = {
      storeId,
      ...(query?.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.category.count({ where }),
      this.prisma.category.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);
    return successRes(paginate(items, total, { page, limit }));
  }

  async update(
    storeId: number,
    id: number,
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

    const updated = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
    return successRes(updated);
  }

  async remove(storeId: number, id: number) {
    const category = await this.prisma.category.findFirst({
      where: { id, storeId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.prisma.category.delete({ where: { id } });
    return successRes({ message: "Toifa o'chirildi", id });
  }
}
