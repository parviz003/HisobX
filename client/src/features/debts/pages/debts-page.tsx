import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HandCoins, AlertTriangle, CheckCircle2, Clock, Phone, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { MoneyText } from '@/components/common/money-text';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import { useCan } from '@/hooks/use-can';
import { debtsApi, debtKeys } from '../api/debts-api';
import type { Debt } from '../api/types';
import { DebtPaymentDialog } from '../components/debt-payment-dialog';

export default function DebtsPage() {
  const canCollect = useCan('debt.collect');
  const [activeTab, setActiveTab] = useState<'all' | 'overdue'>('all');
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);

  // Barcha qarzlar
  const queryAll = usePaginatedQuery({
    queryKey: debtKeys.list({ isPaid: false }),
    fetchPage: ({ page, limit, signal }) =>
      debtsApi.list({ page, limit, isPaid: false }, signal),
    enabled: activeTab === 'all',
  });

  // Muddati o'tgan qarzlar
  const queryOverdue = useQuery({
    queryKey: debtKeys.overdue(),
    queryFn: ({ signal }) => debtsApi.overdue(signal),
    enabled: activeTab === 'overdue',
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Qarzlar va Nasiyalar"
        description="Mijozlar qarzlari, to'lov muddatlari va qarz undirish"
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'overdue')}>
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="all" className="flex items-center gap-1.5">
            <Clock className="size-4" />
            <span>Faol qarzlar</span>
          </TabsTrigger>
          <TabsTrigger value="overdue" className="flex items-center gap-1.5 text-destructive">
            <AlertTriangle className="size-4" />
            <span>Muddati o'tgan</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 pt-2">
          {queryAll.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-36 rounded-2xl" />
              ))}
            </div>
          ) : queryAll.isError ? (
            <ErrorState onRetry={() => void queryAll.refetch()} />
          ) : queryAll.items.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Qarzlar mavjud emas"
              description="Hozirda barcha nasiya qarzlar to'langan yoki qarzlar mavjud emas."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {queryAll.items.map((debt) => (
                <div
                  key={debt.id}
                  className="bg-card rounded-2xl border p-4 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-base truncate">
                        {debt.customer?.name ?? 'Noma’lum mijoz'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 font-medium">
                        Qoldiq
                      </span>
                    </div>

                    {debt.customer?.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="size-3.5" />
                        <a href={`tel:${debt.customer.phone}`} className="hover:underline">
                          {debt.customer.phone}
                        </a>
                      </div>
                    )}

                    {debt.dueDate && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                        <Clock className="size-3" />
                        <span>Muddati: {new Date(debt.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">Qarz summasi:</div>
                      <div className="font-bold text-base text-destructive">
                        <MoneyText value={debt.remainingAmount} />
                      </div>
                    </div>

                    {canCollect && (
                      <Button
                        size="sm"
                        className="gap-1 min-h-touch"
                        onClick={() => setPayingDebt(debt)}
                      >
                        <ArrowUpRight className="size-4" />
                        <span>To'lash</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {queryAll.hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => void queryAll.fetchNextPage()}
                disabled={queryAll.isFetchingNextPage}
              >
                {queryAll.isFetchingNextPage ? "Yuklanmoqda..." : "Ko'proq yuklash"}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4 pt-2">
          {queryOverdue.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-36 rounded-2xl" />
              ))}
            </div>
          ) : queryOverdue.isError ? (
            <ErrorState onRetry={() => void queryOverdue.refetch()} />
          ) : !queryOverdue.data || queryOverdue.data.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Muddati o'tgan qarzlar yo'q"
              description="Barcha qarzlar o'z vaqtida to'lanmoqda."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {queryOverdue.data.map((group, idx) => (
                <div
                  key={group.customer.id || idx}
                  className="bg-card rounded-2xl border border-destructive/30 p-4 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-base truncate">
                        {group.customer.name}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">
                        Kechikkan
                      </span>
                    </div>

                    {group.customer.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="size-3.5" />
                        <a href={`tel:${group.customer.phone}`} className="hover:underline">
                          {group.customer.phone}
                        </a>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Qarzlar soni: {group.debts.length} ta
                    </div>
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">Jami kechikkan:</div>
                      <div className="font-bold text-base text-destructive">
                        <MoneyText value={group.totalOwed} />
                      </div>
                    </div>

                    {canCollect && group.debts[0] && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1 min-h-touch"
                        onClick={() => setPayingDebt(group.debts[0])}
                      >
                        <ArrowUpRight className="size-4" />
                        <span>To'lash</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <DebtPaymentDialog
        open={payingDebt !== null}
        onOpenChange={(open) => !open && setPayingDebt(null)}
        debt={payingDebt}
      />
    </div>
  );
}
