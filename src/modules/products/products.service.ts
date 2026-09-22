import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../config/database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { Prisma } from '@prisma/client';
import { File } from '../../infrastructure/lib/File';
import { successRes } from '../../common/helper/success-response';
import 'multer';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    storeId: number,
    dto: CreateProductDto,
    image?: Express.Multer.File,
  ) {
    if (dto.barcode) {
      const existing = await this.prisma.product.findUnique({
        where: { storeId_barcode: { storeId, barcode: dto.barcode } },
      });
      if (existing) {
        throw new ConflictException(
          'Bunday shtrix-kodli mahsulot allaqachon mavjud',
        );
      }
    }

    let imageUrl: string | undefined;
    if (image) {
      imageUrl = await File.create(image);
    }

    const product = await this.prisma.product.create({
      data: {
        ...dto,
        sellingPrice: Number(dto.sellingPrice),
        minStock: dto.minStock ? Number(dto.minStock) : 0,
        imageUrl,
        storeId,
      },
    });

    return successRes(product, 201);
  }

  async findAll(storeId: number, query: QueryProductDto) {
    const { page = 1, limit = 10, categoryId, isActive, search } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Prisma.ProductWhereInput = { storeId };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isActive !== undefined) {
      where.isActive = String(isActive) === 'true';
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [total, data] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true } },
        },
      }),
    ]);

    return successRes({
      data,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  }

  async findOne(storeId: number, id: number) {
    const product = await this.prisma.product.findFirst({
      where: { id, storeId },
      include: {
        category: true,
      },
    });

    if (!product) throw new NotFoundException('Mahsulot topilmadi');
    return successRes(product);
  }

  async update(
    storeId: number,
    id: number,
    dto: UpdateProductDto,
    image?: Express.Multer.File,
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id, storeId },
    });
    if (!product) throw new NotFoundException('Mahsulot topilmadi');

    if (dto.barcode) {
      const existing = await this.prisma.product.findUnique({
        where: { storeId_barcode: { storeId, barcode: dto.barcode } },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          'Bunday shtrix-kodli mahsulot allaqachon mavjud',
        );
      }
    }

    let imageUrl = product.imageUrl;
    if (image) {
      if (imageUrl && (await File.exist(imageUrl))) {
        await File.delete(imageUrl);
      }
      imageUrl = await File.create(image);
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        sellingPrice:
          dto.sellingPrice !== undefined ? Number(dto.sellingPrice) : undefined,
        minStock: dto.minStock !== undefined ? Number(dto.minStock) : undefined,
        imageUrl,
      },
    });

    return successRes(updated);
  }

  async remove(storeId: number, id: number) {
    const product = await this.prisma.product.findFirst({
      where: { id, storeId },
    });
    if (!product) throw new NotFoundException('Mahsulot topilmadi');

    if (product.imageUrl && (await File.exist(product.imageUrl))) {
      await File.delete(product.imageUrl);
    }

    await this.prisma.product.update({
      where: { id },
      data: { isActive: false, imageUrl: null },
    });

    return successRes({ message: "Mahsulot o'chirildi" });
  }
}
