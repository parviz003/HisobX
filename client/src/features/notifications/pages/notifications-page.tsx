import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Calendar,
  Send,
  CheckCircle2,
  Package,
  Clock,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { debtsApi, debtKeys } from '@/features/debts/api/debts-api';
import { reportsApi, reportKeys } from '@/features/reports/api/reports-api';
import {
  notificationsApi,
  notificationKeys,
  type NotificationItem,
} from '../api/notifications-api';
import { MoneyText } from '@/components/common/money-text';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const botUrl =
    import.meta.env.VITE_TELEGRAM_BOT_URL || 'https://t.me/tgruevwdsb_bot';

  // Do'kon tizim bildirishnomalari
  const { data: notificationsData, isLoading: isNotificationsLoading } =
    useQuery({
      queryKey: notificationKeys.lists(),
      queryFn: ({ signal }) => notificationsApi.list(undefined, signal),
    });

  const systemNotifications = notificationsData?.items ?? [];

  // Muddati o'tgan qarzlar
  const { data: overdueDebts = [] } = useQuery({
    queryKey: debtKeys.overdue(),
    queryFn: ({ signal }) => debtsApi.overdue(signal),
  });

  // Bugungi hisobot
  const { data: report } = useQuery({
    queryKey: reportKeys.daily(),
    queryFn: ({ signal }) => reportsApi.daily(undefined, signal),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      toast.success("Barcha bildirishnomalar o'qilgan deb belgilandi");
    },
    onError: () => {
      toast.error('Xatolik yuz berdi');
    },
  });

  const markOneMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });

  const lowStockCount = report?.lowStockProductsCount ?? 0;
  const unreadCount = systemNotifications.filter((n) => !n.isRead).length;
  const hasNotifications =
    systemNotifications.length > 0 ||
    overdueDebts.length > 0 ||
    lowStockCount > 0;

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'LOW_STOCK':
        return <Package className="size-5 text-amber-600" />;
      case 'DEBT_OVERDUE':
        return <AlertCircle className="size-5 text-destructive" />;
      case 'DEBT_REMINDER':
        return <Clock className="size-5 text-blue-600" />;
      case 'DAILY_REPORT':
        return <Calendar className="size-5 text-emerald-600" />;
      default:
        return <Bell className="size-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Bildirishnomalar va Ogohlantirishlar"
        description="Do'konning muhim moliyaviy va operatsion eslatmalari"
        actions={
          unreadCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
            >
              <Check className="size-3.5" />
              <span>Barchasini o'qilgan qilish</span>
            </Button>
          ) : null
        }
      />

      {/* Telegram bot info banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Send className="size-5" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">Telegram Bot Eslatmalari</h4>
            <p className="text-xs text-muted-foreground">
              Barcha qarz muddatlari va kunlik hisobotlar avtomatik Telegram botingizga yuboriladi.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="shrink-0 text-xs"
          onClick={() => window.open(botUrl, '_blank')}
        >
          Botni ochish
        </Button>
      </div>

      {!hasNotifications ? (
        <EmptyState
          icon={CheckCircle2}
          title="Yangi bildirishnomalar yo'q"
          description="Hozirda barcha qarzlar va mahsulot zaxiralari me'yorda."
        />
      ) : (
        <div className="space-y-3">
          {/* Tizim bildirishnomalari */}
          {systemNotifications.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                Tizim xabarlari {unreadCount > 0 && `(${unreadCount} ta yangi)`}
              </h3>
              {systemNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => !item.isRead && markOneMutation.mutate(item.id)}
                  className={`bg-card rounded-2xl border p-4 flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                    !item.isRead
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border/60 hover:border-border'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="size-9 rounded-xl bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      {getNotificationIcon(item.type)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">{item.title}</h4>
                        {!item.isRead && (
                          <span className="size-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.message}</p>
                      <span className="text-[10px] text-muted-foreground block pt-1">
                        {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {!item.isRead && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs shrink-0 h-8 px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        markOneMutation.mutate(item.id);
                      }}
                    >
                      O'qildi
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Kam qolgan tovarlar bildirishnomasi */}
          {lowStockCount > 0 && (
            <div className="bg-card border border-amber-500/30 rounded-2xl p-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="size-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">Omborda kam qolgan tovarlar!</h4>
                  <p className="text-xs text-muted-foreground">
                    Do'kondagi {lowStockCount} ta mahsulotning zaxira qoldig'i minimal chegaraga yetdi.
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="text-xs shrink-0"
                onClick={() => navigate('/inventory')}
              >
                Omborga o'tish
              </Button>
            </div>
          )}

          {/* Muddati o'tgan qarzlar bildirishnomasi */}
          {overdueDebts.map((group) => (
            <div
              key={group.customer.id}
              className="bg-card border border-destructive/30 rounded-2xl p-4 flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="size-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm text-destructive">
                    Kechikkan qarz: {group.customer.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Umumiy muddati o'tgan qarz miqdori:{' '}
                    <strong className="text-foreground">
                      <MoneyText value={group.totalOwed} />
                    </strong>
                    {group.customer.phone && ` (Tel: ${group.customer.phone})`}
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                variant="destructive"
                className="text-xs shrink-0"
                onClick={() => navigate('/debts')}
              >
                Qarzni undirish
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
