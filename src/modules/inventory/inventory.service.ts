import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../config/database/prisma.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async purchase(storeId: string, dto: CreateInventoryDto) {
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

      return { product: updatedProduct, transaction };
    });
  }

  async writeOff(storeId: string, dto: CreateInventoryDto) {
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

      return { product: updatedProduct, transaction };
    });
  }

  async openingStock(storeId: string, dto: CreateInventoryDto) {
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

      return { product: updatedProduct, transaction };
    });
  }

  async getTransactions(storeId: string, query: QueryInventoryDto) {
    const { productId, type, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = {
      storeId,
      ...(productId && { productId }),
      ...(type && { type }),
    };

    const [data, total] = await Promise.all([
      this.prisma.inventoryTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, name: true, barcode: true, unit: true },
          },
        },
      }),
      this.prisma.inventoryTransaction.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getStockLevels(storeId: string) {
    const products = await this.prisma.product.findMany({
      where: { storeId },
      select: {
        id: true,
        name: true,
        stock: true,
        minStock: true,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    return products.map((p) => ({
      ...p,
      lowStock: p.stock <= p.minStock,
    }));
  }
}
