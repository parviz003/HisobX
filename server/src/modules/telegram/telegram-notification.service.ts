import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../config/database/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { env } from '../../config';
import { NotificationType, SaleStatus } from '@prisma/client';

@Injectable()
export class TelegramNotificationService {
  private readonly logger = new Logger(TelegramNotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async sendToChat(chatId: string, message: string): Promise<boolean> {
    if (!env.TELEGRAM.TOKEN || !chatId) {
      this.logger.log(`[LOCAL NOTIFICATION] ChatId: ${chatId}\n${message}`);
      return true;
    }

    try {
      const url = `https://api.telegram.org/bot${env.TELEGRAM.TOKEN}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });
      return response.ok;
    } catch (e: any) {
      this.logger.error(`Telegram yuborishda xatolik: ${e.message}`);
      return false;
    }
  }

  /**
   * Do'kon guruhiga qo'lda test xabar yuboradi.
   * telegramChatId sozlanmagan bo'lsa yoki Telegram rad etsa xatolik qaytaradi.
   */
  async sendTestMessage(storeId: number, message: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, name: true, telegramChatId: true },
    });
    if (!store) throw new NotFoundException("Do'kon topilmadi");
    if (!store.telegramChatId) {
      throw new BadRequestException(
        "Do'kon uchun telegramChatId sozlanmagan. PATCH /stores/me orqali qo'shing",
      );
    }

    const sent = await this.sendToChat(
      store.telegramChatId,
      `\u{1F9EA} <b>${store.name} \u2014 test xabar</b>\n\n${message}`,
    );
    if (!sent) {
      throw new ServiceUnavailableException(
        "Telegramga xabar yuborib bo'lmadi",
      );
    }

    return {
      message: "Xabar muvaffaqiyatli jo'natildi",
      chatId: store.telegramChatId,
    };
  }

  // 1. Har soatda qarzlar muddatini tekshirish
  @Cron(CronExpression.EVERY_HOUR)
  async checkDebtReminders() {
    this.logger.log('Qarzdorlik eslatmalari tekshirilmoqda...');
    const now = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(now.getDate() + 3);

    const stores = await this.prisma.store.findMany({
      where: { isActive: true, telegramChatId: { not: null } },
      select: { id: true, name: true, telegramChatId: true },
    });

    for (const store of stores) {
      if (!store.telegramChatId) continue;

      // Muddati o'tgan qarzlar
      const overdueDebts = await this.prisma.debt.findMany({
        where: {
          storeId: store.id,
          isPaid: false,
          deletedAt: null,
          dueDate: { lt: now },
        },
        include: { customer: true, sale: true },
      });

      if (overdueDebts.length > 0) {
        let msg = `⚠️ <b>${store.name}: Muddati o‘tgan qarzlar (${overdueDebts.length} ta)</b>\n\n`;
        for (const d of overdueDebts.slice(0, 5)) {
          msg += `👤 <b>${d.customer.name}</b> (${d.customer.phone || 'Tel yo‘q'})\n`;
          msg += `💰 Qarz: ${Number(d.remainingAmount).toLocaleString('uz-UZ')} so‘m\n`;
          msg += `📅 Muddat: ${d.dueDate ? d.dueDate.toISOString().split('T')[0] : 'Noma‘lum'}\n\n`;
        }

        await this.sendToChat(store.telegramChatId, msg);

        await this.prisma.notification.create({
          data: {
            storeId: store.id,
            type: NotificationType.DEBT_OVERDUE,
            title: 'Muddati o‘tgan qarzlar',
            message: `${overdueDebts.length} ta mijozning qarzdorlik muddati o‘tgan`,
            isSent: true,
          },
        });
      }
    }
  }

  // 2. Kam qolgan tovarlar (Low stock)
  @Cron(CronExpression.EVERY_4_HOURS)
  async checkLowStock() {
    this.logger.log('Kam qolgan mahsulotlar tekshirilmoqda...');
    const stores = await this.prisma.store.findMany({
      where: { isActive: true, telegramChatId: { not: null } },
      select: { id: true, name: true, telegramChatId: true },
    });

    for (const store of stores) {
      if (!store.telegramChatId) continue;

      const lowStockProducts = await this.prisma.product.findMany({
        where: {
          storeId: store.id,
          isActive: true,
        },
      });

      const alerts = lowStockProducts.filter((p) => p.stock <= p.minStock);

      if (alerts.length > 0) {
        let msg = `📦 <b>${store.name}: Tugab borayotgan mahsulotlar (${alerts.length} ta)</b>\n\n`;
        for (const p of alerts.slice(0, 5)) {
          msg += `• <b>${p.name}</b>: Qoldiq ${p.stock} ${p.unit} (Min: ${p.minStock})\n`;
        }

        await this.sendToChat(store.telegramChatId, msg);

        await this.prisma.notification.create({
          data: {
            storeId: store.id,
            type: NotificationType.LOW_STOCK,
            title: 'Zaxira ogohlantirishi',
            message: `${alerts.length} ta mahsulot zaxirasi kritik darajada kam`,
            isSent: true,
          },
        });
      }
    }
  }

  // 3. Har kuni kechki soat 22:00 da kunlik hisobot
  @Cron('0 22 * * *')
  async sendDailySummary() {
    this.logger.log('Kunlik hisobotlar yuborilmoqda...');
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const stores = await this.prisma.store.findMany({
      where: { isActive: true, telegramChatId: { not: null } },
      select: { id: true, name: true, telegramChatId: true },
    });

    for (const store of stores) {
      if (!store.telegramChatId) continue;

      const [sales, expenses, lastCashTx] = await Promise.all([
        this.prisma.sale.findMany({
          where: {
            storeId: store.id,
            status: SaleStatus.COMPLETED,
            createdAt: { gte: startOfDay, lte: endOfDay },
            deletedAt: null,
          },
          include: { saleItems: true },
        }),
        this.prisma.expense.findMany({
          where: {
            storeId: store.id,
            createdAt: { gte: startOfDay, lte: endOfDay },
            deletedAt: null,
          },
        }),
        this.prisma.cashTransaction.findFirst({
          where: { storeId: store.id, deletedAt: null },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      let revenue = 0;
      let cogs = 0;
      for (const s of sales) {
        revenue += Number(s.totalAmount);
        for (const item of s.saleItems) {
          cogs += Number(item.costPrice) * item.quantity;
        }
      }

      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const grossProfit = revenue - cogs;
      const netProfit = grossProfit - totalExpenses;
      const currentCash = lastCashTx ? Number(lastCashTx.balance) : 0;

      const msg = `
📊 <b>${store.name} — Kunlik Yakuniy Hisobot (${today.toISOString().split('T')[0]})</b>

🛒 <b>Savdolar soni:</b> ${sales.length} ta
💵 <b>Jami tushum:</b> ${revenue.toLocaleString('uz-UZ')} so‘m
📦 <b>Tannarx (COGS):</b> ${cogs.toLocaleString('uz-UZ')} so‘m
📈 <b>Yalpi foyda:</b> ${grossProfit.toLocaleString('uz-UZ')} so‘m
💸 <b>Xarajatlar:</b> ${totalExpenses.toLocaleString('uz-UZ')} so‘m
💎 <b>Sof foyda:</b> ${netProfit.toLocaleString('uz-UZ')} so‘m
💰 <b>Kassadagi qoldiq:</b> ${currentCash.toLocaleString('uz-UZ')} so‘m
      `.trim();

      await this.sendToChat(store.telegramChatId, msg);

      await this.prisma.notification.create({
        data: {
          storeId: store.id,
          type: NotificationType.DAILY_REPORT,
          title: 'Kunlik yakuniy hisobot',
          message: `Sof foyda: ${netProfit} so‘m, Tushum: ${revenue} so‘m`,
          isSent: true,
        },
      });
    }
  }
}
