import { useQuery } from '@tanstack/react-query';
import { Bell, AlertTriangle, AlertCircle, Calendar, Send, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { debtsApi, debtKeys } from '@/features/debts/api/debts-api';
import { reportsApi, reportKeys } from '@/features/reports/api/reports-api';
import { MoneyText } from '@/components/common/money-text';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const botUrl = import.meta.env.VITE_TELEGRAM_BOT_URL || 'https://t.me/tgruevwdsb_bot';

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

  const lowStockCount = report?.lowStockProductsCount ?? 0;
  const hasNotifications = overdueDebts.length > 0 || lowStockCount > 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Bildirishnomalar va Ogohlantirishlar"
        description="Do'konning muhim moliyaviy va operatsion eslatmalari"
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
                    <strong className="text-foreground"><MoneyText value={group.totalOwed} /></strong>
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
