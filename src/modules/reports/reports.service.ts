import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/database/prisma.service';
import { successRes } from '../../common/helper/success-response';
import { SaleStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDailyReport(storeId: string, dateString?: string) {
    const targetDate = dateString ? new Date(dateString) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const [sales, expenses, cashTx, lowStockCount, totalDebts] = await Promise.all([
      this.prisma.sale.findMany({
        where: {
          storeId,
          status: SaleStatus.COMPLETED,
          createdAt: { gte: startOfDay, lte: endOfDay },
          deletedAt: null,
        },
        include: {
          saleItems: true,
        },
      }),
      this.prisma.expense.findMany({
        where: {
          storeId,
          createdAt: { gte: startOfDay, lte: endOfDay },
          deletedAt: null,
        },
      }),
      this.prisma.cashTransaction.findFirst({
        where: { storeId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({
        where: {
          storeId,
          isActive: true,
          stock: { lte: this.prisma.product.fields.minStock },
        },
      }),
      this.prisma.debt.aggregate({
        where: { storeId, isPaid: false, deletedAt: null },
        _sum: { remainingAmount: true },
      }),
    ]);

    let totalRevenue = 0;
    let totalCogs = 0;

    for (const sale of sales) {
      totalRevenue += Number(sale.totalAmount);
      for (const item of sale.saleItems) {
        totalCogs += Number(item.costPrice) * item.quantity;
      }
    }

    const grossProfit = totalRevenue - totalCogs;
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const netProfit = grossProfit - totalExpenses;
    const currentCashBalance = cashTx ? Number(cashTx.balance) : 0;
    const totalOutstandingDebt = Number(totalDebts._sum.remainingAmount || 0);

    return successRes({
      date: [
        startOfDay.getFullYear(),
        String(startOfDay.getMonth() + 1).padStart(2, '0'),
        String(startOfDay.getDate()).padStart(2, '0'),
      ].join('-'),
      salesCount: sales.length,
      revenue: totalRevenue,
      cogs: totalCogs,
      grossProfit,
      expenses: totalExpenses,
      netProfit,
      cashBalance: currentCashBalance,
      totalOutstandingDebt,
      lowStockProductsCount: lowStockCount,
    });
  }

  async getMonthlyReport(storeId: string, year?: number, month?: number) {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month !== undefined ? month - 1 : now.getMonth();

    const startOfMonth = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    const [sales, expenses] = await Promise.all([
      this.prisma.sale.findMany({
        where: {
          storeId,
          status: SaleStatus.COMPLETED,
          createdAt: { gte: startOfMonth, lte: endOfMonth },
          deletedAt: null,
        },
        include: {
          saleItems: true,
        },
      }),
      this.prisma.expense.findMany({
        where: {
          storeId,
          createdAt: { gte: startOfMonth, lte: endOfMonth },
          deletedAt: null,
        },
      }),
    ]);

    let totalRevenue = 0;
    let totalCogs = 0;

    for (const sale of sales) {
      totalRevenue += Number(sale.totalAmount);
      for (const item of sale.saleItems) {
        totalCogs += Number(item.costPrice) * item.quantity;
      }
    }

    const grossProfit = totalRevenue - totalCogs;
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const netProfit = grossProfit - totalExpenses;

    return successRes({
      year: targetYear,
      month: targetMonth + 1,
      totalSalesCount: sales.length,
      revenue: totalRevenue,
      cogs: totalCogs,
      grossProfit,
      expenses: totalExpenses,
      netProfit,
    });
  }
}
