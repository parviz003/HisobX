import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../config/database/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { env } from '../../config';
import { NotificationType, Role, SaleStatus } from '@prisma/client';

export interface SaleNotificationItem {
  name: string;
  quantity: number;
  price: number | string;
  unit?: string | null;
  total?: number | string;
}

export interface SaleNotificationData {
  saleNumber: number;
  totalAmount: number | string;
  subtotal?: number | string;
  discountPercent?: number;
  discountAmount?: number | string;
  paymentType: string;
  customerName?: string | null;
  customerPhone?: string | null;
  sellerName?: string | null;
  items: SaleNotificationItem[];
}

export interface LowStockNotificationData {
  name: string;
  stock: number;
  minStock: number;
  unit?: string | null;
}

export interface DebtPaymentNotificationData {
  customerName: string;
  customerPhone?: string | null;
  amount: number | string;
  remainingAmount: number | string;
  isPaid: boolean;
  note?: string | null;
  saleNumber?: number | null;
}

export interface ExpenseNotificationData {
  categoryName: string;
  amount: number | string;
  userName?: string | null;
  balance?: number | string | null;
  note?: string | null;
}

@Injectable()
export class TelegramNotificationService {
  private readonly logger = new Logger(TelegramNotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getRecipientChatIds(
    storeId: number,
    options?: {
      actorUserId?: number;
      roles?: Role[];
    },
  ): Promise<string[]> {
    try {
      const targetRoles = options?.roles ?? [Role.ADMIN, Role.MANAGER];
      const chatIds = new Set<string>();

      const store = await this.prisma.store.findUnique({
        where: { id: storeId },
        select: {
          telegramChatId: true,
          users: {
            where: {
              isActive: true,
              telegramChatId: { not: null },
            },
            select: {
              id: true,
              role: true,
              telegramChatId: true,
            },
          },
        },
      });

      if (!store) return [];

      for (const u of store.users) {
        if (u.telegramChatId && targetRoles.includes(u.role)) {
          chatIds.add(u.telegramChatId);
        }
      }

      if (options?.actorUserId) {
        const actor = store.users.find((u) => u.id === options.actorUserId);
        if (actor?.telegramChatId) {
          chatIds.add(actor.telegramChatId);
        } else {
          const actorUser = await this.prisma.user.findUnique({
            where: { id: options.actorUserId },
            select: { telegramChatId: true },
          });
          if (actorUser?.telegramChatId) {
            chatIds.add(actorUser.telegramChatId);
          }
        }
      }

      if (store.telegramChatId) {
        const superAdminId = env.TELEGRAM.ID ? String(env.TELEGRAM.ID) : null;
        const isSuperAdminPersonalChat = store.telegramChatId === superAdminId;
        const hasStoreUsers = store.users.length > 0;

        if (!isSuperAdminPersonalChat || !hasStoreUsers) {
          chatIds.add(store.telegramChatId);
        }
      }

      return Array.from(chatIds);
    } catch (err: any) {
      this.logger.error(`getRecipientChatIds xatosi: ${err.message}`);
      return [];
    }
  }

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


  async sendToRecipients(
    chatIds: string[],
    message: string,
  ): Promise<number> {
    if (chatIds.length === 0) {
      this.logger.log('Yuborish uchun faol Telegram chat topilmadi');
      return 0;
    }

    let sentCount = 0;
    for (const chatId of chatIds) {
      const ok = await this.sendToChat(chatId, message);
      if (ok) sentCount++;
    }
    return sentCount;
  }


  async notifySale(
    storeId: number,
    data: SaleNotificationData,
    actorUserId?: number,
  ): Promise<void> {
    try {
      const chatIds = await this.getRecipientChatIds(storeId, { actorUserId });
      if (chatIds.length === 0) return;

      const store = await this.prisma.store.findUnique({
        where: { id: storeId },
        select: { name: true },
      });
      const storeName = store?.name || "Do'kon";

      const paymentLabel =
        data.paymentType === 'CASH' ? '💵 Naqd pul' : '📋 Nasiya (Qarz)';
      const timeStr = new Date().toLocaleTimeString('uz-UZ', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const dateStr = new Date().toISOString().split('T')[0];

      let itemsText = '';
      for (const item of data.items.slice(0, 8)) {
        const itemTotal =
          item.total !== undefined
            ? Number(item.total)
            : Number(item.price) * item.quantity;
        itemsText += `  • <b>${item.name}</b>: ${item.quantity} ${item.unit || 'dona'} × ${Number(item.price).toLocaleString('uz-UZ')} = ${itemTotal.toLocaleString('uz-UZ')} so‘m\n`;
      }
      if (data.items.length > 8) {
        itemsText += `  • <i>... va yana ${data.items.length - 8} ta mahsulot</i>\n`;
      }

      const msg = `
🛒 <b>${storeName}: Yangi savdo #${data.saleNumber}</b>

💰 <b>Jami summa:</b> ${Number(data.totalAmount).toLocaleString('uz-UZ')} so‘m
💳 <b>To‘lov:</b> ${paymentLabel}
${data.customerName ? `👤 <b>Mijoz:</b> ${data.customerName} ${data.customerPhone ? `(${data.customerPhone})` : ''}\n` : ''}${data.sellerName ? `👨‍💼 <b>Sotuvchi:</b> ${data.sellerName}\n` : ''}${data.discountPercent ? `🎁 <b>Chegirma:</b> ${data.discountPercent}%\n` : ''}
📦 <b>Mahsulotlar:</b>
${itemsText}
⏰ <b>Vaqt:</b> ${dateStr} ${timeStr}
      `.trim();

      await this.sendToRecipients(chatIds, msg);
    } catch (err: any) {
      this.logger.error(`notifySale xatosi: ${err.message}`);
    }
  }


  async notifyLowStock(
    storeId: number,
    product: LowStockNotificationData,
  ): Promise<void> {
    try {
      const chatIds = await this.getRecipientChatIds(storeId);
      const store = await this.prisma.store.findUnique({
        where: { id: storeId },
        select: { name: true },
      });
      const storeName = store?.name || "Do'kon";

      const msg = `
⚠️ <b>${storeName}: Zaxira ogohlantirishi! (Kam qoldi)</b>

📦 <b>Mahsulot:</b> ${product.name}
📊 <b>Qolgan qoldiq:</b> ${product.stock} ${product.unit || 'dona'}
📉 <b>Minimal chegara:</b> ${product.minStock} ${product.unit || 'dona'}

❗️ <i>Iltimos, mahsulot zaxirasini o‘z vaqtida to‘ldiring!</i>
      `.trim();

      if (chatIds.length > 0) {
        await this.sendToRecipients(chatIds, msg);
      }

      await this.prisma.notification.create({
        data: {
          storeId,
          type: NotificationType.LOW_STOCK,
          title: 'Zaxira ogohlantirishi',
          message: `${product.name} mahsulotidan atigi ${product.stock} ${product.unit || 'dona'} qoldi (minimal chegara: ${product.minStock})`,
          isSent: chatIds.length > 0,
        },
      });
    } catch (err: any) {
      this.logger.error(`notifyLowStock xatosi: ${err.message}`);
    }
  }


  async notifyDebtPayment(
    storeId: number,
    data: DebtPaymentNotificationData,
    actorUserId?: number,
  ): Promise<void> {
    try {
      const chatIds = await this.getRecipientChatIds(storeId, { actorUserId });
      const store = await this.prisma.store.findUnique({
        where: { id: storeId },
        select: { name: true },
      });
      const storeName = store?.name || "Do'kon";

      const timeStr = new Date().toLocaleTimeString('uz-UZ', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const dateStr = new Date().toISOString().split('T')[0];

      const msg = `
💳 <b>${storeName}: Qarz to‘lovi qabul qilindi</b>

👤 <b>Mijoz:</b> ${data.customerName} ${data.customerPhone ? `(${data.customerPhone})` : ''}
💵 <b>To‘langan summa:</b> ${Number(data.amount).toLocaleString('uz-UZ')} so‘m
${data.isPaid ? '✅ <b>Qarz to‘liq yopildi!</b>' : `📊 <b>Qolgan qarz:</b> ${Number(data.remainingAmount).toLocaleString('uz-UZ')} so‘m`}
${data.note ? `📝 <b>Izoh:</b> ${data.note}\n` : ''}${data.saleNumber ? `🧾 <b>Savdo:</b> #${data.saleNumber}\n` : ''}⏰ <b>Vaqt:</b> ${dateStr} ${timeStr}
      `.trim();

      if (chatIds.length > 0) {
        await this.sendToRecipients(chatIds, msg);
      }

      await this.prisma.notification.create({
        data: {
          storeId,
          type: NotificationType.DEBT_REMINDER,
          title: 'Qarz to‘lovi qabul qilindi',
          message: `${data.customerName}: ${Number(data.amount).toLocaleString('uz-UZ')} so‘m to‘landi. ${data.isPaid ? 'Qarz to‘liq yopildi' : `Qolgan qarz: ${Number(data.remainingAmount).toLocaleString('uz-UZ')} so‘m`}`,
          isSent: chatIds.length > 0,
        },
      });
    } catch (err: any) {
      this.logger.error(`notifyDebtPayment xatosi: ${err.message}`);
    }
  }


  async notifyExpense(
    storeId: number,
    data: ExpenseNotificationData,
    actorUserId?: number,
  ): Promise<void> {
    try {
      const chatIds = await this.getRecipientChatIds(storeId, { actorUserId });
      if (chatIds.length === 0) return;

      const store = await this.prisma.store.findUnique({
        where: { id: storeId },
        select: { name: true },
      });
      const storeName = store?.name || "Do'kon";

      const timeStr = new Date().toLocaleTimeString('uz-UZ', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const dateStr = new Date().toISOString().split('T')[0];

      const msg = `
💸 <b>${storeName}: Yangi xarajat kiritildi</b>

📁 <b>Toifa:</b> ${data.categoryName}
💵 <b>Summa:</b> ${Number(data.amount).toLocaleString('uz-UZ')} so‘m
${data.userName ? `👤 <b>Kiritdi:</b> ${data.userName}\n` : ''}${data.balance !== undefined && data.balance !== null ? `💰 <b>Kassada qolgan qoldiq:</b> ${Number(data.balance).toLocaleString('uz-UZ')} so‘m\n` : ''}${data.note ? `📝 <b>Izoh:</b> ${data.note}\n` : ''}⏰ <b>Vaqt:</b> ${dateStr} ${timeStr}
      `.trim();

      await this.sendToRecipients(chatIds, msg);
    } catch (err: any) {
      this.logger.error(`notifyExpense xatosi: ${err.message}`);
    }
  }


  async sendTestMessage(storeId: number, message: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, name: true, telegramChatId: true },
    });
    if (!store) throw new NotFoundException("Do'kon topilmadi");

    const chatIds = await this.getRecipientChatIds(storeId);
    if (chatIds.length === 0) {
      throw new BadRequestException(
        "Do'kon xodimlari yoki administratori Telegramini ulamagan. Profil yoki sozlamalardan Telegramni ulang",
      );
    }

    const count = await this.sendToRecipients(
      chatIds,
      `🧪 <b>${store.name} — test xabar</b>\n\n${message}`,
    );

    return {
      message: `${count} ta shaxsiy/guruh chatiga xabar muvaffaqiyatli jo'natildi`,
      chatIds,
    };
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkDebtReminders() {
    this.logger.log('Qarzdorlik eslatmalari tekshirilmoqda...');
    const now = new Date();

    const stores = await this.prisma.store.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    for (const store of stores) {
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
        const chatIds = await this.getRecipientChatIds(store.id);
        if (chatIds.length > 0) {
          let msg = `⚠️ <b>${store.name}: Muddati o‘tgan qarzlar (${overdueDebts.length} ta)</b>\n\n`;
          for (const d of overdueDebts.slice(0, 5)) {
            msg += `👤 <b>${d.customer.name}</b> (${d.customer.phone || 'Tel yo‘q'})\n`;
            msg += `💰 Qarz: ${Number(d.remainingAmount).toLocaleString('uz-UZ')} so‘m\n`;
            msg += `📅 Muddat: ${d.dueDate ? d.dueDate.toISOString().split('T')[0] : 'Noma‘lum'}\n\n`;
          }
          await this.sendToRecipients(chatIds, msg);
        }

        await this.prisma.notification.create({
          data: {
            storeId: store.id,
            type: NotificationType.DEBT_OVERDUE,
            title: 'Muddati o‘tgan qarzlar',
            message: `${overdueDebts.length} ta mijozning qarzdorlik muddati o‘tgan`,
            isSent: chatIds.length > 0,
          },
        });
      }
    }
  }


  @Cron(CronExpression.EVERY_4_HOURS)
  async checkLowStock() {
    this.logger.log('Kam qolgan mahsulotlar tekshirilmoqda...');
    const stores = await this.prisma.store.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    for (const store of stores) {
      const lowStockProducts = await this.prisma.product.findMany({
        where: {
          storeId: store.id,
          isActive: true,
        },
      });

      const alerts = lowStockProducts.filter((p) => p.stock <= p.minStock);

      if (alerts.length > 0) {
        const chatIds = await this.getRecipientChatIds(store.id);
        if (chatIds.length > 0) {
          let msg = `📦 <b>${store.name}: Tugab borayotgan mahsulotlar (${alerts.length} ta)</b>\n\n`;
          for (const p of alerts.slice(0, 5)) {
            msg += `• <b>${p.name}</b>: Qoldiq ${p.stock} ${p.unit} (Min: ${p.minStock})\n`;
          }
          await this.sendToRecipients(chatIds, msg);
        }

        await this.prisma.notification.create({
          data: {
            storeId: store.id,
            type: NotificationType.LOW_STOCK,
            title: 'Zaxira ogohlantirishi',
            message: `${alerts.length} ta mahsulot zaxirasi kritik darajada kam`,
            isSent: chatIds.length > 0,
          },
        });
      }
    }
  }


  @Cron('0 22 * * *')
  async sendDailySummary() {
    this.logger.log('Kunlik hisobotlar yuborilmoqda...');
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const stores = await this.prisma.store.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    for (const store of stores) {
      const chatIds = await this.getRecipientChatIds(store.id);
      if (chatIds.length === 0) continue;

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

      const totalExpenses = expenses.reduce(
        (sum, e) => sum + Number(e.amount),
        0,
      );
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

      await this.sendToRecipients(chatIds, msg);

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
