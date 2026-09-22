import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/database/prisma.service';
import { QueryDebtDto } from './dto/query-debt.dto';
import { MakePaymentDto } from './dto/make-payment.dto';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import { Prisma } from '@prisma/client';
import { successRes } from '../../common/helper/success-response';

@Injectable()
export class DebtsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryDebtDto, storeId: number) {
    const { page = 1, limit = 10, customerId, isPaid } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.DebtWhereInput = {
      storeId,
      deletedAt: null,
      ...(customerId && { customerId }),
      ...(isPaid !== undefined && { isPaid }),
    };

    const [total, data] = await Promise.all([
      this.prisma.debt.count({ where }),
      this.prisma.debt.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          sale: {
            select: {
              id: true,
              saleNumber: true,
              totalAmount: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return successRes({
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  async findOne(id: number, storeId: number) {
    const debt = await this.prisma.debt.findUnique({
      where: { id },
      include: {
        customer: true,
        sale: {
          include: { saleItems: { include: { product: true } } },
        },
        debtPayments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!debt || debt.storeId !== storeId || debt.deletedAt) {
      throw new NotFoundException('Qarz topilmadi');
    }

    return successRes(debt);
  }

  async getOverdue(storeId: number) {
    const overdueDebts = await this.prisma.debt.findMany({
      where: {
        storeId,
        isPaid: false,
        deletedAt: null,
        dueDate: { lt: new Date() },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
      },
    });

    const grouped = overdueDebts.reduce(
      (acc, debt) => {
        const { customerId, customer, remainingAmount } = debt;
        if (!acc[customerId]) {
          acc[customerId] = {
            customer,
            totalOwed: new Prisma.Decimal(0),
            debts: [],
          };
        }
        acc[customerId].totalOwed =
          acc[customerId].totalOwed.add(remainingAmount);
        acc[customerId].debts.push(debt);
        return acc;
      },
      {} as Record<number, any>,
    );

    return successRes(Object.values(grouped));
  }

  async makePayment(
    id: number,
    dto: MakePaymentDto,
    storeId: number,
    userId: number,
  ) {
    const { amount, note } = dto;
    const paymentAmount = new Prisma.Decimal(amount);

    return this.prisma.$transaction(async (tx) => {
      const debt = await tx.debt.findUnique({
        where: { id },
        include: { sale: true },
      });

      if (!debt || debt.storeId !== storeId || debt.deletedAt) {
        throw new NotFoundException('Qarz topilmadi');
      }

      if (debt.isPaid) {
        throw new BadRequestException("Qarz to'liq to'langan");
      }

      if (paymentAmount.greaterThan(debt.remainingAmount)) {
        throw new BadRequestException(
          `To'lov summasi qolgan qarz miqdoridan oshmasligi kerak. Qolgan qarz: ${debt.remainingAmount}`,
        );
      }

      const newRemainingAmount = debt.remainingAmount.sub(paymentAmount);
      const isPaid = newRemainingAmount.equals(new Prisma.Decimal(0));

      const updatedDebt = await tx.debt.update({
        where: { id },
        data: {
          remainingAmount: newRemainingAmount,
          isPaid,
          debtPayments: {
            create: {
              amount: paymentAmount,
              note,
              storeId: storeId,
            },
          },
        },
        include: {
          debtPayments: true,
        },
      });

      // Get last cash transaction for balance calculation
      const lastCashTransaction = await tx.cashTransaction.findFirst({
        where: { storeId: storeId },
        orderBy: { createdAt: 'desc' },
      });

      const previousBalance = lastCashTransaction
        ? lastCashTransaction.balance
        : new Prisma.Decimal(0);
      const newBalance = previousBalance.add(paymentAmount);

      // Create cash transaction for debt payment
      await tx.cashTransaction.create({
        data: {
          type: 'DEBT_PAYMENT',
          amount: paymentAmount,
          balance: newBalance,
          note: `Sale #${debt.sale.saleNumber} uchun qarz to'lovi${note ? ` - ${note}` : ''}`,
          storeId: storeId,
          userId: userId,
          saleId: debt.saleId,
        },
      });

      return successRes(updatedDebt);
    });
  }
}
