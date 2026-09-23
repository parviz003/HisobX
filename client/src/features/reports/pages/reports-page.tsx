import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Calendar, TrendingUp, TrendingDown, DollarSign, Wallet, ArrowDown } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { MoneyText } from '@/components/common/money-text';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { reportsApi, reportKeys } from '../api/reports-api';

export default function ReportsPage() {
  const todayStr = new Date().toISOString().split('T')[0];
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

  // Kunlik hisobot
  const { data: dailyReport, isLoading: isDailyLoading } = useQuery({
    queryKey: reportKeys.daily(selectedDate),
    queryFn: ({ signal }) => reportsApi.daily(selectedDate, signal),
    enabled: activeTab === 'daily',
  });

  // Oylik hisobot
  const { data: monthlyReport, isLoading: isMonthlyLoading } = useQuery({
    queryKey: reportKeys.monthly(selectedYear, selectedMonth),
    queryFn: ({ signal }) => reportsApi.monthly(selectedYear, selectedMonth, signal),
    enabled: activeTab === 'monthly',
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Moliyaviy Hisobotlar"
        description="Kunlik va oylik foyda, tushum, tannarx (COGS) va xarajatlar tahlili"
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'daily' | 'monthly')}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList className="grid w-full sm:w-64 grid-cols-2">
            <TabsTrigger value="daily">Kunlik hisobot</TabsTrigger>
            <TabsTrigger value="monthly">Oylik hisobot</TabsTrigger>
          </TabsList>

          {/* Sana boshqaruvi */}
          {activeTab === 'daily' ? (
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40 h-9 text-xs"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Select
                value={String(selectedMonth)}
                onValueChange={(val) => setSelectedMonth(Number(val))}
              >
                <SelectTrigger className="w-32 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
                    'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
                  ].map((m, idx) => (
                    <SelectItem key={idx + 1} value={String(idx + 1)} className="text-xs">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={String(selectedYear)}
                onValueChange={(val) => setSelectedYear(Number(val))}
              >
                <SelectTrigger className="w-24 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                    <SelectItem key={y} value={String(y)} className="text-xs">
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Kunlik hisobot tab */}
        <TabsContent value="daily" className="space-y-4 pt-3">
          {isDailyLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : dailyReport ? (
            <>
              {/* Asosiy ko'rsatkichlar */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="bg-card rounded-2xl border p-4 space-y-1">
                  <span className="text-xs text-muted-foreground">Tushum (Revenue)</span>
                  <div className="text-2xl font-bold text-emerald-600">
                    <MoneyText value={dailyReport.revenue} />
                  </div>
                  <p className="text-[11px] text-muted-foreground">{dailyReport.salesCount} ta savdo</p>
                </div>

                <div className="bg-card rounded-2xl border p-4 space-y-1">
                  <span className="text-xs text-muted-foreground">Tannarx (COGS)</span>
                  <div className="text-2xl font-bold text-amber-600">
                    <MoneyText value={dailyReport.cogs} />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Sotilgan tovarlar tannarxi</p>
                </div>

                <div className="bg-card rounded-2xl border p-4 space-y-1">
                  <span className="text-xs text-muted-foreground">Yalpi Foyda (Gross Profit)</span>
                  <div className="text-2xl font-bold text-blue-600">
                    <MoneyText value={dailyReport.grossProfit} />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Tushum - Tannarx</p>
                </div>

                <div className="bg-card rounded-2xl border p-4 space-y-1">
                  <span className="text-xs text-muted-foreground">Xarajatlar (Expenses)</span>
                  <div className="text-2xl font-bold text-destructive">
                    <MoneyText value={dailyReport.expenses} />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Do'kon chiqimlari</p>
                </div>

                <div className="bg-card rounded-2xl border p-4 space-y-1 col-span-2 sm:col-span-1 lg:col-span-2 bg-gradient-to-r from-primary/10 to-primary/5">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Sof Foyda (Net Profit)</span>
                  <div className="text-3xl font-extrabold text-primary">
                    <MoneyText value={dailyReport.netProfit} />
                  </div>
                  <p className="text-xs text-muted-foreground">Yalpi foyda - Xarajatlar</p>
                </div>
              </div>

              {/* Qo'shimcha balans ko'rsatkichlari */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="rounded-2xl border p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Wallet className="size-5" />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Kunlik Kassa Balansi</span>
                      <div className="text-lg font-bold">
                        <MoneyText value={dailyReport.cashBalance} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                      <TrendingDown className="size-5" />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Umumiy Nasiya Qarzlar</span>
                      <div className="text-lg font-bold text-amber-600">
                        <MoneyText value={dailyReport.totalOutstandingDebt} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </TabsContent>

        {/* Oylik hisobot tab */}
        <TabsContent value="monthly" className="space-y-4 pt-3">
          {isMonthlyLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : monthlyReport ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="bg-card rounded-2xl border p-4 space-y-1">
                  <span className="text-xs text-muted-foreground">Oylik Tushum</span>
                  <div className="text-2xl font-bold text-emerald-600">
                    <MoneyText value={monthlyReport.revenue} />
                  </div>
                  <p className="text-[11px] text-muted-foreground">{monthlyReport.totalSalesCount} ta savdo</p>
                </div>

                <div className="bg-card rounded-2xl border p-4 space-y-1">
                  <span className="text-xs text-muted-foreground">Oylik Tannarx (COGS)</span>
                  <div className="text-2xl font-bold text-amber-600">
                    <MoneyText value={monthlyReport.cogs} />
                  </div>
                </div>

                <div className="bg-card rounded-2xl border p-4 space-y-1">
                  <span className="text-xs text-muted-foreground">Yalpi Foyda</span>
                  <div className="text-2xl font-bold text-blue-600">
                    <MoneyText value={monthlyReport.grossProfit} />
                  </div>
                </div>

                <div className="bg-card rounded-2xl border p-4 space-y-1">
                  <span className="text-xs text-muted-foreground">Oylik Xarajatlar</span>
                  <div className="text-2xl font-bold text-destructive">
                    <MoneyText value={monthlyReport.expenses} />
                  </div>
                </div>

                <div className="bg-card rounded-2xl border p-4 space-y-1 col-span-2 bg-gradient-to-r from-primary/10 to-primary/5">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Oylik Sof Foyda</span>
                  <div className="text-3xl font-extrabold text-primary">
                    <MoneyText value={monthlyReport.netProfit} />
                  </div>
                  <p className="text-xs text-muted-foreground">Oy yakuni bo'yicha sof daromad</p>
                </div>
              </div>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
