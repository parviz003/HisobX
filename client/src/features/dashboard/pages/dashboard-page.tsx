import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Receipt,
  Wallet,
  AlertCircle,
  Package,
  Layers,
  ArrowUpRight,
  TrendingDown,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { PageHeader } from '@/components/common/page-header';
import { MoneyText } from '@/components/common/money-text';
import { Button } from '@/components/ui/button';
import { reportsApi, reportKeys } from '@/features/reports/api/reports-api';
import { salesApi, saleKeys } from '@/features/sales/api/sales-api';
import { KpiCard } from '../components/kpi-card';
import { QuickActions } from '../components/quick-actions';
import { LowStockAlert } from '../components/low-stock-alert';

export default function DashboardPage() {
  const navigate = useNavigate();

  // Bugungi hisobot ko'rsatkichlari
  const { data: report, isLoading: isReportLoading } = useQuery({
    queryKey: reportKeys.daily(),
    queryFn: ({ signal }) => reportsApi.daily(undefined, signal),
  });

  // Oxirgi 5 ta savdo
  const { data: recentSalesData, isLoading: isSalesLoading } = useQuery({
    queryKey: saleKeys.list({ limit: 5 }),
    queryFn: ({ signal }) => salesApi.list({ limit: 5 }, signal),
  });

  const recentSales = recentSalesData?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Boshqaruv Paneli"
        description="Do'konning bugungi moliyaviy holati va asosiy ko'rsatkichlari"
      />

      {/* Kam qolgan tovarlar haqida ogohlantirish */}
      <LowStockAlert count={report?.lowStockProductsCount ?? 0} />

      {/* KPI Kartalar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          title="Bugungi Tushum"
          value={report?.revenue ?? 0}
          icon={TrendingUp}
          colorClass="text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40"
          subtext={`Savdolar: ${report?.salesCount ?? 0} ta`}
          isLoading={isReportLoading}
        />

        <KpiCard
          title="Bugungi Sof Foyda"
          value={report?.netProfit ?? 0}
          icon={Receipt}
          colorClass="text-blue-600 bg-blue-100 dark:bg-blue-950/40"
          subtext={`Yalpi: ${(report?.grossProfit ?? 0).toLocaleString()} so'm`}
          isLoading={isReportLoading}
        />

        <KpiCard
          title="Kassadagi Pul"
          value={report?.cashBalance ?? 0}
          icon={Wallet}
          colorClass="text-indigo-600 bg-indigo-100 dark:bg-indigo-950/40"
          subtext="Joriy naqd balans"
          isLoading={isReportLoading}
        />

        <KpiCard
          title="To'lanmagan Qarzlar"
          value={report?.totalOutstandingDebt ?? 0}
          icon={AlertCircle}
          colorClass="text-amber-600 bg-amber-100 dark:bg-amber-950/40"
          subtext="Mijozlar umumiy qarzi"
          isLoading={isReportLoading}
        />
      </div>

      {/* Tezkor amallar */}
      <QuickActions />

      {/* Pastki qism: Oxirgi savdolar */}
      <div className="bg-card rounded-2xl border p-4 space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-primary" />
            <h3 className="font-semibold text-sm">Oxirgi savdolar</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-primary gap-1"
            onClick={() => navigate('/sales')}
          >
            <span>Barchasi</span>
            <ArrowUpRight className="size-3.5" />
          </Button>
        </div>

        {recentSales.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            Bugun hali savdolar amalga oshirilmadi.
          </p>
        ) : (
          <div className="divide-y">
            {recentSales.map((sale) => (
              <div
                key={sale.id}
                className="py-2.5 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-sm">Chek № {sale.saleNumber}</div>
                  <div className="text-muted-foreground mt-0.5">
                    {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {sale.customer && <span> • {sale.customer.name}</span>}
                    <span> • {sale.paymentType === 'CASH' ? 'Naqd' : 'Nasiya'}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-sm text-foreground">
                    <MoneyText value={sale.totalAmount} />
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      sale.status === 'CANCELLED'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                    }`}
                  >
                    {sale.status === 'CANCELLED' ? 'Bekor' : 'OK'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
