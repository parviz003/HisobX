import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wallet, ArrowDownRight, ArrowUpRight, Plus, RefreshCw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { MoneyText } from '@/components/common/money-text';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import { cashApi, cashKeys } from '../api/cash-api';
import type { CashTransactionType } from '../api/types';
import { CashBalanceCard } from '../components/cash-balance-card';
import { CashTransactionDialog } from '../components/cash-transaction-dialog';

const TYPE_CONFIG: Record<
  CashTransactionType,
  { label: string; isIncome: boolean; color: string }
> = {
  SALE: { label: 'Savdo tushumi', isIncome: true, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40' },
  DEBT_PAYMENT: { label: "Qarz to'lovi", isIncome: true, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40' },
  OPENING: { label: "Boshlang'ich kassa", isIncome: true, color: 'text-blue-600 bg-blue-100 dark:bg-blue-950/40' },
  EXPENSE: { label: 'Xarajat chiqimi', isIncome: false, color: 'text-destructive bg-destructive/10' },
  ADJUSTMENT: { label: "Kassa to'g'rilash", isIncome: false, color: 'text-amber-600 bg-amber-100 dark:bg-amber-950/40' },
};

export default function CashPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');

  const { data: balanceData, isLoading: isBalanceLoading, refetch: refetchBalance } = useQuery({
    queryKey: cashKeys.balance(),
    queryFn: ({ signal }) => cashApi.balance(signal),
  });

  const query = usePaginatedQuery({
    queryKey: cashKeys.transactionList({
      type: filterType !== 'ALL' ? (filterType as CashTransactionType) : undefined,
    }),
    fetchPage: ({ page, limit, signal }) =>
      cashApi.transactions(
        {
          page,
          limit,
          type: filterType !== 'ALL' ? (filterType as CashTransactionType) : undefined,
        },
        signal,
      ),
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Kassa operatsiyalari"
        description="Do'kon kassa balansi va barcha pul oqimlari (kirim va chiqim) jurnali"
      />

      {/* Kassa balansi kartasi */}
      <CashBalanceCard
        data={balanceData}
        isLoading={isBalanceLoading}
        onOpenTransaction={() => setDialogOpen(true)}
      />

      {/* Filtrlar va ro'yxat bosh qismi */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <h3 className="font-semibold text-sm flex items-center gap-1.5">
          <span>Kassa harakatlari tarixi</span>
          <span className="text-xs text-muted-foreground">({query.total} ta)</span>
        </h3>

        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-8 text-xs w-44">
              <SelectValue placeholder="Barcha turlar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">Barcha operatsiyalar</SelectItem>
              <SelectItem value="SALE" className="text-xs">Savdo tushumi</SelectItem>
              <SelectItem value="DEBT_PAYMENT" className="text-xs">Qarz to'lovi</SelectItem>
              <SelectItem value="EXPENSE" className="text-xs">Xarajatlar</SelectItem>
              <SelectItem value="OPENING" className="text-xs">Boshlang'ich kassa</SelectItem>
              <SelectItem value="ADJUSTMENT" className="text-xs">To'g'rilash</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => {
              void refetchBalance();
              void query.refetch();
            }}
            aria-label="Yangilash"
          >
            <RefreshCw className="size-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Operatsiyalar jurnali */}
      {query.isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : query.items.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Kassa harakatlari mavjud emas"
          description="Hozircha hech qanday kassa harakati amalga oshirilmagan."
        />
      ) : (
        <div className="space-y-2">
          {query.items.map((tx) => {
            const config = TYPE_CONFIG[tx.type] ?? {
              label: tx.type,
              isIncome: true,
              color: 'text-foreground bg-muted',
            };
            return (
              <div
                key={tx.id}
                className="bg-card rounded-2xl border p-3.5 flex items-center justify-between gap-3 text-xs sm:text-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${config.color}`}
                  >
                    {config.isIncome ? (
                      <ArrowDownRight className="size-5" />
                    ) : (
                      <ArrowUpRight className="size-5" />
                    )}
                  </div>

                  <div className="truncate space-y-0.5">
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      <span>{config.label}</span>
                      {tx.sale?.saleNumber && (
                        <span className="text-[11px] font-normal text-muted-foreground">
                          (Chek № {tx.sale.saleNumber})
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {tx.note && <span className="ml-1.5">• {tx.note}</span>}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`font-bold text-sm sm:text-base ${
                      config.isIncome ? 'text-emerald-600' : 'text-destructive'
                    }`}
                  >
                    {config.isIncome ? '+' : '-'}
                    <MoneyText value={tx.amount} />
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Qoldiq: <MoneyText value={tx.balance} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {query.hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => void query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
          >
            {query.isFetchingNextPage ? "Yuklanmoqda..." : "Ko'proq yuklash"}
          </Button>
        </div>
      )}

      {/* Kassa harakati modali */}
      <CashTransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
