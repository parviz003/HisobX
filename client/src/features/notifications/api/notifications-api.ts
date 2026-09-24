import { api } from '@/lib/api/client';
import type { Paginated } from '@/lib/api/pagination';

export type NotificationType =
  | 'DEBT_REMINDER'
  | 'DEBT_OVERDUE'
  | 'LOW_STOCK'
  | 'DAILY_REPORT';

export interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  isSent: boolean;
  storeId: number;
  createdAt: string;
}

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (isRead?: boolean) => [...notificationKeys.lists(), { isRead }] as const,
};

export const notificationsApi = {
  list: async (
    isRead?: boolean,
    signal?: AbortSignal,
  ): Promise<Paginated<NotificationItem>> => {
    const { data } = await api.get<Paginated<NotificationItem>>('/notifications', {
      params: { ...(isRead !== undefined ? { isRead } : {}), limit: 50 },
      signal,
    });
    return data;
  },

  markAsRead: async (id: number): Promise<NotificationItem> => {
    const { data } = await api.patch<NotificationItem>(`/notifications/${id}/read`);
    return data;
  },

  markAllAsRead: async (): Promise<{ count: number; message: string }> => {
    const { data } = await api.patch<{ count: number; message: string }>(
      '/notifications/read-all',
    );
    return data;
  },
};
