import { useQuery } from '@tanstack/react-query';
import { Phone, MapPin, Calendar, Receipt, AlertCircle } from 'lucide-react';
import { ResponsiveDialog } from '@/components/common/responsive-dialog';
import { MoneyText } from '@/components/common/money-text';
import { Skeleton } from '@/components/ui/skeleton';
import { customersApi, customerKeys } from '../api/customers-api';

interface Props {
  customerId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDetailDialog({ customerId, open, onOpenChange }: Props) {
  const { data: customer, isLoading } = useQuery({
    queryKey: customerKeys.detail(customerId ?? 0),
    queryFn: () => customersApi.byId(customerId!),
    enabled: open && !!customerId,
  });

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={customer?.name ?? 'Mijoz profili'}
      description="Mijoz tafsilotlari va qarzlar holati"
    >
      {isLoading ? (
        <div className="space-y-3 py-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : customer ? (
        <div className="space-y-4 py-1">
          {/* Kontakt ma'lumotlari */}
          <div className="bg-muted/50 rounded-xl p-3.5 space-y-2 text-sm">
            {customer.phone && (
              <div className="flex items-center gap-2.5">
                <Phone className="size-4 text-muted-foreground shrink-0" />
                <a href={`tel:${customer.phone}`} className="text-primary font-medium hover:underline">
                  {customer.phone}
                </a>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-2.5">
                <MapPin className="size-4 text-muted-foreground shrink-0" />
                <span>{customer.address}</span>
              </div>
            )}
            {customer.notes && (
              <div className="text-muted-foreground text-xs pt-1 border-t">
                {customer.notes}
              </div>
            )}
          </div>

          {/* Umumiy qarz balansi */}
          <div className="rounded-xl border p-4 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Umumiy qarzdorlik:</span>
            <div className="text-right">
              <span className={`text-lg font-bold ${(customer.totalDebt ?? 0) > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                <MoneyText value={customer.totalDebt ?? 0} />
              </span>
            </div>
          </div>

          {/* Qarzlar ro'yxati */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <Receipt className="size-4 text-muted-foreground" />
              Qarzlar ro'yxati ({customer.debts?.length ?? 0})
            </h4>

            {(!customer.debts || customer.debts.length === 0) ? (
              <p className="text-xs text-muted-foreground text-center py-4 bg-muted/20 rounded-lg">
                Hozircha qarz yozuvlari yo'q
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {customer.debts.map((debt) => (
                  <div
                    key={debt.id}
                    className="p-3 rounded-lg border text-sm flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">
                        Qoldiq: <MoneyText value={debt.remainingAmount} />
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="size-3" />
                        Jami: <MoneyText value={debt.amount} />
                        {debt.dueDate && (
                          <span className="ml-1 text-destructive flex items-center gap-0.5">
                            <AlertCircle className="size-3" />
                            Muddat: {new Date(debt.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          debt.isPaid
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}
                      >
                        {debt.isPaid ? "To'langan" : "Faol"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </ResponsiveDialog>
  );
}
