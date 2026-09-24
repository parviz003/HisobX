import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/database/prisma.service';
import { QueryDebtDto } from './dto/query-debt.dto';
import { MakePaymentDto } from './dto/make-payment.dto';
import { Prisma } from '@prisma/client';
import { successRes } from '../../common/helper/success-response';
import { pageParams, paginate } from '../../common/helper/paginate';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { TelegramNotificationService } from '../telegram/telegram-notification.service';

@Injectable()
export class DebtsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramNotificationService: TelegramNotificationService,
  ) {}

  async findAll(query: QueryDebtDto, storeId: number) {
    const { customerId, isPaid } = query;
    const { page, limit, skip, take } = pageParams(query);

    const where: Prisma.DebtWhereInput = {
      storeId,
      deletedAt: null,
      ...(customerId && { customerId }),
      ...(isPaid !== undefined && { isPaid }),
    };

    const [total, items] = await Promise.all([
      this.prisma.debt.count({ where }),
      this.prisma.debt.findMany({
        where,
        skip,
        take,
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

    return successRes(paginate(items, total, { page, limit }));
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

  async getOverdue(storeId: number, query?: PaginationQueryDto) {
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

    const groups = Object.values(grouped);
    const { page, limit, skip, take } = pageParams(query);
    return successRes(
      paginate(groups.slice(skip, skip + take), groups.length, { page, limit }),
    );
  }

  async makePayment(
    id: number,
    dto: MakePaymentDto,
    storeId: number,
    userId: number,
  ) {
    const { amount, note } = dto;
    const paymentAmount = new Prisma.Decimal(amount);

    const result = await this.prisma.$transaction(async (tx) => {
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

      return { updatedDebt, debt };
    });

    // Fire-and-forget Telegram notification
    void (async () => {
      try {
        const customer = await this.prisma.customer.findUnique({
          where: { id: result.debt.customerId },
          select: { name: true, phone: true },
        });

        await this.telegramNotificationService.notifyDebtPayment(storeId, {
          customerName: customer?.name || 'Mijoz',
          customerPhone: customer?.phone || null,
          amount: Number(paymentAmount),
          remainingAmount: Number(result.updatedDebt.remainingAmount),
          isPaid: result.updatedDebt.isPaid,
          note: note || null,
          saleNumber: result.debt.sale?.saleNumber || null,
        }, userId);
      } catch (err: any) {
        // Safe error handling
      }
    })();

    return successRes(result.updatedDebt);
  }
}
