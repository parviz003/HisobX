import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../config/database/prisma.service';
import { CreateCashTransactionDto } from './dto/create-cash-transaction.dto';
import { QueryCashTransactionDto } from './dto/query-cash-transaction.dto';
import { CashTransactionType, Prisma } from '@prisma/client';
import { successRes } from '../../common/helper/success-response';
import { pageParams, paginate } from '../../common/helper/paginate';

@Injectable()
export class CashService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalance(storeId: number) {
    const lastTx = await this.prisma.cashTransaction.findFirst({
      where: { storeId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: { balance: true, createdAt: true },
    });

    const balance = lastTx ? Number(lastTx.balance) : 0;
    return successRes({
      balance,
      lastUpdated: lastTx?.createdAt || null,
    });
  }

  async create(storeId: number, userId: number, dto: CreateCashTransactionDto) {
    return this.prisma.$transaction(async (tx) => {
      const lastTx = await tx.cashTransaction.findFirst({
        where: { storeId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });

      const currentBalance = lastTx ? Number(lastTx.balance) : 0;
      let newBalance = currentBalance;

      if (
        dto.type === CashTransactionType.SALE ||
        dto.type === CashTransactionType.DEBT_PAYMENT ||
        dto.type === CashTransactionType.OPENING
      ) {
        newBalance += Number(dto.amount);
      } else if (
        dto.type === CashTransactionType.EXPENSE ||
        dto.type === CashTransactionType.ADJUSTMENT
      ) {
        if (
          currentBalance < Number(dto.amount) &&
          dto.type === CashTransactionType.EXPENSE
        ) {
          throw new BadRequestException(
            `Kassada yetarli mablag‘ mavjud emas. Joriy balans: ${currentBalance}`,
          );
        }
        newBalance -= Number(dto.amount);
      }

      const transaction = await tx.cashTransaction.create({
        data: {
          storeId,
          userId,
          type: dto.type,
          amount: dto.amount,
          balance: newBalance,
          note: dto.note,
        },
        include: {
          user: { select: { id: true, fullName: true, phone: true } },
        },
      });

      return successRes(transaction, 201);
    });
  }

  async findAll(storeId: number, query: QueryCashTransactionDto) {
    const { type, startDate, endDate } = query;
    const { page, limit, skip, take } = pageParams(query);

    const where: Prisma.CashTransactionWhereInput = {
      storeId,
      deletedAt: null,
    };

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [total, items] = await Promise.all([
      this.prisma.cashTransaction.count({ where }),
      this.prisma.cashTransaction.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, fullName: true, phone: true } },
          sale: { select: { id: true, saleNumber: true, totalAmount: true } },
        },
      }),
    ]);

    return successRes(paginate(items, total, { page, limit }));
  }
}
