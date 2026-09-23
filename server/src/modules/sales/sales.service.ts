import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../config/database/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { QuerySaleDto } from './dto/query-sale.dto';
import { PaymentType, SaleStatus, Prisma, Role } from '@prisma/client';
import { successRes } from '../../common/helper/success-response';
import { pageParams, paginate } from '../../common/helper/paginate';
import { hideCostFields } from '../../common/helper/cost-visibility';
import { IPayload } from '../../common/interface';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: number, userId: number, createSaleDto: CreateSaleDto) {
    const {
      items,
      paymentType,
      customerId,
      discountPercent = 0,
      note,
      dueDate,
    } = createSaleDto;

    if (items.length === 0) {
      throw new BadRequestException('Sale must contain at least one item');
    }

    if (paymentType === PaymentType.CREDIT && !customerId) {
      throw new BadRequestException('Customer is required for credit sales');
    }

    return this.prisma.$transaction(async (prisma) => {
      // 1. Validate and get products
      const productIds = items.map((i) => i.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds }, storeId, isActive: true },
      });

      if (products.length !== productIds.length) {
        throw new BadRequestException(
          'Some products were not found or are inactive',
        );
      }

      const productMap = new Map(products.map((p) => [p.id, p]));

      let subtotal = 0;
      const saleItemsData: {
        productId: number;
        quantity: number;
        price: any;
        costPrice: any;
        total: number;
      }[] = [];

      for (const item of items) {
        const product = productMap.get(item.productId)!;
        if (product.stock < item.quantity) {
          throw new BadRequestException(`Not enough stock for ${product.name}`);
        }

        const itemTotal = Number(product.sellingPrice) * item.quantity;
        subtotal += itemTotal;

        saleItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.sellingPrice,
          costPrice: product.lastPurchasePrice,
          total: itemTotal,
        });
      }

      // 2. Get saleNumber
      const lastSale = await prisma.sale.findFirst({
        where: { storeId },
        orderBy: { saleNumber: 'desc' },
        select: { saleNumber: true },
      });
      const saleNumber = lastSale ? lastSale.saleNumber + 1 : 1;

      // 3 & 4. Calculate totals
      const discountAmount = (subtotal * discountPercent) / 100;
      const totalAmount = subtotal - discountAmount;

      // 5. Create Sale
      const sale = await prisma.sale.create({
        data: {
          storeId,
          userId,
          customerId,
          saleNumber,
          status: SaleStatus.COMPLETED,
          paymentType,
          subtotal,
          discountPercent,
          discountAmount,
          totalAmount,
          note,
          saleItems: {
            create: saleItemsData,
          },
        },
      });

      // 7. Decrease stock and create inventory transactions
      for (const item of items) {
        const product = productMap.get(item.productId)!;

        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });

        await prisma.inventoryTransaction.create({
          data: {
            storeId,
            productId: item.productId,
            type: 'SALE',
            quantity: -item.quantity,
            unitPrice: product.sellingPrice,
          },
        });
      }

      // 8 & 9. Handle Payments
      if (paymentType === PaymentType.CASH) {
        // Find latest cash transaction to calculate balance
        const lastCashTx = await prisma.cashTransaction.findFirst({
          where: { storeId },
          orderBy: { createdAt: 'desc' },
        });
        const currentBalance = lastCashTx ? Number(lastCashTx.balance) : 0;

        await prisma.cashTransaction.create({
          data: {
            storeId,
            userId,
            saleId: sale.id,
            type: 'SALE',
            amount: totalAmount,
            balance: currentBalance + totalAmount,
            note: `Sale #${saleNumber}`,
          },
        });
      } else if (paymentType === PaymentType.CREDIT) {
        await prisma.debt.create({
          data: {
            storeId,
            customerId: customerId!,
            saleId: sale.id,
            amount: totalAmount,
            remainingAmount: totalAmount,
            dueDate: dueDate ? new Date(dueDate) : null,
          },
        });
      }

      return successRes(sale, 201);
    });
  }

  async findAll(storeId: number, actor: IPayload, query: QuerySaleDto) {
    const { status, paymentType, customerId, startDate, endDate } = query;
    const { page, limit, skip, take } = pageParams(query);

    const where: Prisma.SaleWhereInput = { storeId, deletedAt: null };

    // SELLER faqat O'Z savdolarini ko'radi (ruxsatlar matritsasi)
    if (actor.role === Role.SELLER) where.userId = actor.sub;

    if (status) where.status = status;
    if (paymentType) where.paymentType = paymentType;
    if (customerId) where.customerId = customerId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [items, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true } },
          user: { select: { name: true } },
        },
      }),
      this.prisma.sale.count({ where }),
    ]);

    return successRes(
      hideCostFields(paginate(items, total, { page, limit }), actor.role),
    );
  }

  async findOne(storeId: number, actor: IPayload, id: number) {
    const sale = await this.prisma.sale.findFirst({
      where: {
        id,
        storeId,
        // Boshqa sotuvchining savdosi SELLER uchun umuman ko'rinmaydi
        ...(actor.role === Role.SELLER ? { userId: actor.sub } : {}),
      },
      include: {
        saleItems: {
          include: {
            product: { select: { name: true, unit: true } },
          },
        },
        customer: true,
        user: { select: { name: true } },
        debts: {
          where: { deletedAt: null },
        },
      },
    });

    if (!sale) throw new NotFoundException('Savdo topilmadi');
    return successRes(hideCostFields(sale, actor.role));
  }

  async cancel(storeId: number, id: number, userId: number) {
    return this.prisma.$transaction(async (prisma) => {
      const sale = await prisma.sale.findFirst({
        where: { id, storeId },
        include: { saleItems: true },
      });

      if (!sale) throw new NotFoundException('Sale not found');
      if (sale.status !== SaleStatus.COMPLETED) {
        throw new BadRequestException('Only COMPLETED sales can be cancelled');
      }

      // 1. Restore stock & create inventory transactions
      for (const item of sale.saleItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });

        await prisma.inventoryTransaction.create({
          data: {
            storeId,
            productId: item.productId,
            type: 'ADJUSTMENT',
            quantity: item.quantity,
            unitPrice: item.price,
            note: `Cancelled sale #${sale.saleNumber}`,
          },
        });
      }

      // 2. Reverse CashTransaction or mark Debt as deleted
      if (sale.paymentType === PaymentType.CASH) {
        const lastCashTx = await prisma.cashTransaction.findFirst({
          where: { storeId },
          orderBy: { createdAt: 'desc' },
        });
        const currentBalance = lastCashTx ? Number(lastCashTx.balance) : 0;
        const totalAmount = Number(sale.totalAmount);

        await prisma.cashTransaction.create({
          data: {
            storeId,
            userId,
            saleId: sale.id,
            type: 'ADJUSTMENT',
            amount: -totalAmount,
            balance: currentBalance - totalAmount,
            note: `Reversed sale #${sale.saleNumber}`,
          },
        });
      } else if (sale.paymentType === PaymentType.CREDIT) {
        await prisma.debt.updateMany({
          where: { saleId: sale.id },
          data: { deletedAt: new Date() },
        });
      }

      // 3. Mark sale as CANCELLED
      const cancelled = await prisma.sale.update({
        where: { id: sale.id },
        data: {
          status: SaleStatus.CANCELLED,
          deletedAt: new Date(),
        },
      });
      return successRes(cancelled);
    });
  }
}
