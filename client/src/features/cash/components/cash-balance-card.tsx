import { Wallet, Clock, PlusCircle } from 'lucide-react';
import { MoneyText } from '@/components/common/money-text';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCan } from '@/hooks/use-can';
import type { CashBalance } from '../api/types';

interface Props {
  data?: CashBalance;
  isLoading: boolean;
  onOpenTransaction: () => void;
}

export function CashBalanceCard({ data, isLoading, onOpenTransaction }: Props) {
  const canAdjust = useCan('cash.adjust');

  return (
    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-card rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Wallet className="size-4 text-primary" />
          <span>Joriy Kassa Balansi</span>
        </div>

        {isLoading ? (
          <Skeleton className="h-9 w-44 rounded-lg" />
        ) : (
          <div className="text-3xl font-extrabold text-foreground tracking-tight">
            <MoneyText value={data?.balance ?? 0} />
          </div>
        )}

        {data?.lastUpdated && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3" />
            <span>Oxirgi harakat: {new Date(data.lastUpdated).toLocaleString()}</span>
          </div>
        )}
      </div>

      {canAdjust && (
        <div className="flex gap-2 shrink-0">
          <Button
            type="button"
            className="gap-1.5 min-h-touch"
            onClick={onOpenTransaction}
          >
            <PlusCircle className="size-4" />
            <span>Kassaga kiritish / To'g'rilash</span>
          </Button>
        </div>
      )}
    </div>
  );
}
