import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/database/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import {
  CreateExpenseCategoryDto,
  UpdateExpenseCategoryDto,
} from './dto/expense-category.dto';
import { QueryExpenseDto } from './dto/query-expense.dto';
import { CashTransactionType, Prisma } from '@prisma/client';
import { successRes } from '../../common/helper/success-response';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  // Category methods
  async findAllCategories(storeId: string) {
    const categories = await this.prisma.expenseCategory.findMany({
      where: { storeId },
      orderBy: { name: 'asc' },
    });
    return successRes(categories);
  }

  async createCategory(storeId: string, dto: CreateExpenseCategoryDto) {
    const existing = await this.prisma.expenseCategory.findUnique({
      where: { storeId_name: { storeId, name: dto.name } },
    });
    if (existing) {
      throw new ConflictException('Bunday xarajat toifasi allaqachon mavjud');
    }

    const category = await this.prisma.expenseCategory.create({
      data: {
        name: dto.name,
        storeId,
      },
    });
    return successRes(category, 201);
  }

  async updateCategory(storeId: string, id: string, dto: UpdateExpenseCategoryDto) {
    const category = await this.prisma.expenseCategory.findFirst({
      where: { id, storeId },
    });
    if (!category) throw new NotFoundException('Toifa topilmadi');

    const updated = await this.prisma.expenseCategory.update({
      where: { id },
      data: dto,
    });
    return successRes(updated);
  }

  async removeCategory(storeId: string, id: string) {
    const category = await this.prisma.expenseCategory.findFirst({
      where: { id, storeId },
      include: { _count: { select: { expenses: true } } },
    });
    if (!category) throw new NotFoundException('Toifa topilmadi');

    if (category._count.expenses > 0) {
      throw new BadRequestException(
        "Bu toifaga tegishli xarajatlar mavjud, o'chirib bo'lmaydi",
      );
    }

    await this.prisma.expenseCategory.delete({ where: { id } });
    return successRes({ message: "Xarajat toifasi o'chirildi" });
  }

  // Expense methods
  async create(storeId: string, userId: string, dto: CreateExpenseDto) {
    return this.prisma.$transaction(async (tx) => {
      const category = await tx.expenseCategory.findFirst({
        where: { id: dto.expenseCategoryId, storeId },
      });
      if (!category) {
        throw new NotFoundException('Xarajat toifasi topilmadi');
      }

      // Kassadan xarajat summasini chiqarish
      const lastCashTx = await tx.cashTransaction.findFirst({
        where: { storeId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });

      const currentBalance = lastCashTx ? Number(lastCashTx.balance) : 0;
      const expenseAmount = Number(dto.amount);

      const newBalance = currentBalance - expenseAmount;

      const expense = await tx.expense.create({
        data: {
          storeId,
          userId,
          expenseCategoryId: dto.expenseCategoryId,
          amount: dto.amount,
          note: dto.note,
        },
        include: {
          expenseCategory: true,
          user: { select: { id: true, fullName: true } },
        },
      });

      await tx.cashTransaction.create({
        data: {
          storeId,
          userId,
          type: CashTransactionType.EXPENSE,
          amount: dto.amount,
          balance: newBalance,
          note: `Xarajat: ${category.name}${dto.note ? ` (${dto.note})` : ''}`,
        },
      });

      return successRes(expense, 201);
    });
  }

  async findAll(storeId: string, query: QueryExpenseDto) {
    const { page = 1, limit = 10, expenseCategoryId, startDate, endDate } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Prisma.ExpenseWhereInput = {
      storeId,
      deletedAt: null,
    };

    if (expenseCategoryId) {
      where.expenseCategoryId = expenseCategoryId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [total, data] = await Promise.all([
      this.prisma.expense.count({ where }),
      this.prisma.expense.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          expenseCategory: true,
          user: { select: { id: true, fullName: true, phone: true } },
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
}
