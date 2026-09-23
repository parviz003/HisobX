import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../config/database/prisma.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { successRes } from '../../common/helper/success-response';
import { pageParams, paginate } from '../../common/helper/paginate';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async purchase(storeId: number, dto: CreateInventoryDto) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id: dto.productId, storeId },
      });
      if (!product) throw new NotFoundException('Mahsulot topilmadi');

      const updatedProduct = await tx.product.update({
        where: { id: dto.productId },
        data: {
          stock: { increment: dto.quantity },
          lastPurchasePrice: dto.unitPrice ?? product.lastPurchasePrice,
        },
      });

      const transaction = await tx.inventoryTransaction.create({
        data: {
          storeId,
          productId: dto.productId,
          type: 'PURCHASE',
          quantity: dto.quantity,
          unitPrice: dto.unitPrice,
          note: dto.note,
        },
      });

      return successRes({ product: updatedProduct, transaction }, 201);
    });
  }

  async writeOff(storeId: number, dto: CreateInventoryDto) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id: dto.productId, storeId },
      });
      if (!product) throw new NotFoundException('Mahsulot topilmadi');
      if (product.stock < dto.quantity) {
        throw new BadRequestException(
          `Yetarli zaxira yo'q. Joriy qoldiq: ${product.stock}`,
        );
      }

      const updatedProduct = await tx.product.update({
        where: { id: dto.productId },
        data: { stock: { decrement: dto.quantity } },
      });

      const transaction = await tx.inventoryTransaction.create({
        data: {
          storeId,
          productId: dto.productId,
          type: 'WRITE_OFF',
          quantity: dto.quantity,
          note: dto.note,
        },
      });

      return successRes({ product: updatedProduct, transaction }, 201);
    });
  }

  async openingStock(storeId: number, dto: CreateInventoryDto) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id: dto.productId, storeId },
      });
      if (!product) throw new NotFoundException('Mahsulot topilmadi');

      const updatedProduct = await tx.product.update({
        where: { id: dto.productId },
        data: {
          stock: { increment: dto.quantity },
          // Boshlang'ich qoldiq narxi tannarx (COGS) uchun snapshot bo'lib qoladi
          lastPurchasePrice: dto.unitPrice ?? product.lastPurchasePrice,
        },
      });

      const transaction = await tx.inventoryTransaction.create({
        data: {
          storeId,
          productId: dto.productId,
          type: 'OPENING',
          quantity: dto.quantity,
          unitPrice: dto.unitPrice,
          note: dto.note,
        },
      });

      return successRes({ product: updatedProduct, transaction }, 201);
    });
  }

  async getTransactions(storeId: number, query: QueryInventoryDto) {
    const { productId, type } = query;
    const { page, limit, skip, take } = pageParams(query);

    const where = {
      storeId,
      ...(productId && { productId }),
      ...(type && { type }),
    };

    const [items, total] = await Promise.all([
      this.prisma.inventoryTransaction.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, name: true, barcode: true, unit: true },
          },
        },
      }),
      this.prisma.inventoryTransaction.count({ where }),
    ]);

    return successRes(paginate(items, total, { page, limit }));
  }

  async getStockLevels(storeId: number, query?: PaginationQueryDto) {
    const { page, limit, skip, take } = pageParams(query);
    const select = {
      id: true,
      name: true,
      stock: true,
      minStock: true,
      isActive: true,
    };

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where: { storeId } }),
      this.prisma.product.findMany({
        where: { storeId },
        select,
        orderBy: { name: 'asc' },
        skip,
        take,
      }),
    ]);

    const items = products.map((p) => ({
      ...p,
      lowStock: p.stock <= p.minStock,
    }));

    return successRes(paginate(items, total, { page, limit }));
  }
}
