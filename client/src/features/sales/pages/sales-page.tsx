import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ReceiptText, Eye, ShieldAlert, Banknote, CreditCard, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { MoneyText } from '@/components/common/money-text';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import { productKeys } from '@/features/products/api/queryKeys';
import { debtKeys } from '@/features/debts/api/debts-api';
import { salesApi, saleKeys } from '../api/sales-api';
import type { Sale } from '../api/types';
import { SaleDetailDialog } from '../components/sale-detail-dialog';

export default function SalesPage() {
  const queryClient = useQueryClient();

  const [paymentType, setPaymentType] = useState<string>('ALL');
  const [status, setStatus] = useState<string>('ALL');

  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [cancellingSale, setCancellingSale] = useState<Sale | null>(null);

  const query = usePaginatedQuery({
    queryKey: saleKeys.list({
      paymentType: paymentType !== 'ALL' ? (paymentType as 'CASH' | 'CREDIT') : undefined,
      status: status !== 'ALL' ? (status as 'COMPLETED' | 'CANCELLED') : undefined,
    }),
    fetchPage: ({ page, limit, signal }) =>
      salesApi.list(
        {
          page,
          limit,
          paymentType: paymentType !== 'ALL' ? (paymentType as 'CASH' | 'CREDIT') : undefined,
          status: status !== 'ALL' ? (status as 'COMPLETED' | 'CANCELLED') : undefined,
        },
        signal,
      ),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => salesApi.cancel(id),
    onSuccess: () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: saleKeys.all }),
        queryClient.invalidateQueries({ queryKey: productKeys.all }),
        queryClient.invalidateQueries({ queryKey: debtKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['cash'] }),
      ]);
      toast.success("Savdo bekor qilindi va ombor/kassa qayta tiklandi");
      setCancellingSale(null);
      setSelectedSaleId(null);
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Savdoni bekor qilib bo'lmadi");
    },
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Savdolar tarixi"
        description="Barcha amalga oshirilgan naqd va nasiya savdolar jurnali"
      />

      {/* Filtrlar */}
      <div className="flex flex-wrap gap-2 items-center bg-card p-3 rounded-2xl border">
        <Filter className="size-4 text-muted-foreground ml-1" />
        <span className="text-xs font-semibold text-muted-foreground">Filtrlar:</span>

        <Select value={paymentType} onValueChange={setPaymentType}>
          <SelectTrigger className="h-8 text-xs w-36">
            <SelectValue placeholder="To'lov turi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="text-xs">Barcha to'lovlar</SelectItem>
            <SelectItem value="CASH" className="text-xs">Naqd pul</SelectItem>
            <SelectItem value="CREDIT" className="text-xs">Nasiya / Qarz</SelectItem>
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-8 text-xs w-36">
            <SelectValue placeholder="Holati" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="text-xs">Barcha holatlar</SelectItem>
            <SelectItem value="COMPLETED" className="text-xs">Yakunlangan</SelectItem>
            <SelectItem value="CANCELLED" className="text-xs">Bekor qilingan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Savdolar ro'yxati */}
      {query.isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : query.items.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="Savdolar topilmadi"
          description="Ushbu filtrlar bo'yicha hech qanday savdo yozuvi mavjud emas."
        />
      ) : (
        <div className="space-y-2">
          {query.items.map((sale) => {
            const isCancelled = sale.status === 'CANCELLED';
            return (
              <div
                key={sale.id}
                onClick={() => setSelectedSaleId(sale.id)}
                className={`bg-card hover:border-primary/50 cursor-pointer rounded-2xl border p-3.5 transition-colors flex items-center justify-between gap-3 ${
                  isCancelled ? 'opacity-60 bg-muted/20' : ''
                }`}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">Chek № {sale.saleNumber}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                        isCancelled
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                      }`}
                    >
                      {isCancelled ? 'Bekor' : 'OK'}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                        sale.paymentType === 'CASH'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                      }`}
                    >
                      {sale.paymentType === 'CASH' ? <Banknote className="size-3" /> : <CreditCard className="size-3" />}
                      <span>{sale.paymentType === 'CASH' ? 'Naqd' : 'Nasiya'}</span>
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>{new Date(sale.createdAt).toLocaleDateString()} {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {sale.customer && (
                      <span className="truncate">
                        • Mijoz: <strong className="text-foreground">{sale.customer.name}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0 flex items-center gap-3">
                  <div>
                    <div className="font-bold text-base">
                      <MoneyText value={sale.totalAmount} />
                    </div>
                    {sale.discountAmount && sale.discountAmount > 0 ? (
                      <div className="text-[11px] text-emerald-600 font-medium">
                        Chegirma: <MoneyText value={sale.discountAmount} />
                      </div>
                    ) : null}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSaleId(sale.id);
                    }}
                    aria-label="Tafsilotlar"
                  >
                    <Eye className="size-4 text-muted-foreground" />
                  </Button>
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

      {/* Tafsilot modali */}
      <SaleDetailDialog
        saleId={selectedSaleId}
        open={selectedSaleId !== null}
        onOpenChange={(open) => !open && setSelectedSaleId(null)}
        onCancelSale={() => {
          const found = query.items.find((s) => s.id === selectedSaleId);
          if (found) setCancellingSale(found);
        }}
      />

      {/* Bekor qilish tasdiqlash dialogi */}
      <ConfirmDialog
        open={cancellingSale !== null}
        onOpenChange={(open) => !open && setCancellingSale(null)}
        title="Savdoni bekor qilish"
        description={`Haqiqatan ham Chek № ${cancellingSale?.saleNumber} savdosini bekor qilmoqchimisiz? Tovarlar zaxiraga qaytariladi va kassa/qarz harakati teskari yoziladi.`}
        confirmLabel="Savdoni bekor qilish"
        destructive
        onConfirm={() => {
          if (cancellingSale) {
            cancelMutation.mutate(cancellingSale.id);
          }
        }}
        loading={cancelMutation.isPending}
      />
    </div>
  );
}
