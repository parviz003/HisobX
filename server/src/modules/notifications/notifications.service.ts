import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/database/prisma.service';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { successRes } from '../../common/helper/success-response';
import { pageParams, paginate } from '../../common/helper/paginate';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(storeId: number, query?: QueryNotificationDto) {
    const { page, limit, skip, take } = pageParams(query);

    const where: Prisma.NotificationWhereInput = {
      storeId,
      ...(query?.isRead !== undefined ? { isRead: query.isRead } : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return successRes(paginate(items, total, { page, limit }));
  }

  async markAsRead(storeId: number, id: number) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, storeId },
    });

    if (!notification) {
      throw new NotFoundException('Bildirishnoma topilmadi');
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return successRes(updated);
  }

  async markAllAsRead(storeId: number) {
    const result = await this.prisma.notification.updateMany({
      where: { storeId, isRead: false },
      data: { isRead: true },
    });

    return successRes({ count: result.count, message: "Barcha bildirishnomalar o'qildi deb belgilandi" });
  }
}
