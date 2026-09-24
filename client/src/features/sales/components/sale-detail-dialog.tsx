import { useQuery } from '@tanstack/react-query';
import { User, Calendar, Receipt, CreditCard, Banknote, ShieldAlert } from 'lucide-react';
import { ResponsiveDialog } from '@/components/common/responsive-dialog';
import { MoneyText } from '@/components/common/money-text';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useCan } from '@/hooks/use-can';
import { salesApi, saleKeys } from '../api/sales-api';

interface Props {
  saleId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancelSale?: () => void;
}

export function SaleDetailDialog({ saleId, open, onOpenChange, onCancelSale }: Props) {
  const canCancel = useCan('sale.cancel');
  const canViewCost = useCan('cost.view');

  const { data: sale, isLoading } = useQuery({
    queryKey: saleKeys.detail(saleId ?? 0),
    queryFn: () => salesApi.byId(saleId!),
    enabled: open && !!saleId,
  });

  const isCancelled = sale?.status === 'CANCELLED';

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={sale ? `Chek № ${sale.saleNumber}` : 'Savdo tafsilotlari'}
      description="Savdo tarkibi, to'lov turi va chegirma ma'lumotlari"
    >
      {isLoading ? (
        <div className="space-y-3 py-2">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : sale ? (
        <div className="space-y-4 py-1 text-xs sm:text-sm">
          {/* Status va sanalar */}
          <div className="bg-muted/40 rounded-xl p-3 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="size-3.5" />
                <span>Sana:</span>
              </span>
              <span className="font-medium">{new Date(sale.createdAt).toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                {sale.paymentType === 'CASH' ? <Banknote className="size-3.5" /> : <CreditCard className="size-3.5" />}
                <span>To'lov usuli:</span>
              </span>
              <span className="font-semibold uppercase">
                {sale.paymentType === 'CASH' ? 'Naqd pul' : 'Nasiya / Qarz'}
              </span>
            </div>

            {sale.customer && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <User className="size-3.5" />
                  <span>Mijoz:</span>
                </span>
                <span className="font-bold text-foreground">{sale.customer.name}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-1 border-t">
              <span className="text-muted-foreground">Holati:</span>
              <span
                className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                  isCancelled
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                }`}
              >
                {isCancelled ? 'Bekor qilingan' : 'Yakunlangan'}
              </span>
            </div>
          </div>

          {/* Mahsulotlar ro'yxati */}
          <div className="space-y-2">
            <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Receipt className="size-3.5" />
              <span>Mahsulotlar ({sale.items?.length ?? 0})</span>
            </h4>

            <div className="border rounded-xl divide-y overflow-hidden max-h-52 overflow-y-auto">
              {sale.items?.map((item) => (
                <div key={item.id} className="p-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="truncate flex-1">
                    <span className="font-medium text-foreground">{item.product?.name ?? `Mahsulot #${item.productId}`}</span>
                    <div className="text-muted-foreground mt-0.5">
                      {item.quantity} {item.product?.unit ?? 'dona'} x <MoneyText value={item.price} />
                      {canViewCost && item.costPrice && (
                        <span className="ml-2 text-[10px] text-muted-foreground/80">
                          (Tannarx: <MoneyText value={item.costPrice} />)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="font-bold text-right shrink-0">
                    <MoneyText value={item.total} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Jami hisob */}
          <div className="space-y-1.5 pt-1 border-t text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Oraliq summa:</span>
              <span><MoneyText value={sale.subtotal} /></span>
            </div>
            {!!sale.discountAmount && sale.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Chegirma ({sale.discountPercent ?? 0}%):</span>
                <span>-<MoneyText value={sale.discountAmount} /></span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-1 border-t">
              <span>Jami summa:</span>
              <span className="text-primary"><MoneyText value={sale.totalAmount} /></span>
            </div>
          </div>

          {/* Bekor qilish tugmasi */}
          {!isCancelled && canCancel && onCancelSale && (
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                onClick={onCancelSale}
              >
                <ShieldAlert className="size-4 mr-1.5" />
                <span>Ushbu savdoni bekor qilish</span>
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </ResponsiveDialog>
  );
}
