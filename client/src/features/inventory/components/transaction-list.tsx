import { useTranslation } from 'react-i18next';
import { ArrowDownLeft, ArrowUpRight, Wrench, PackagePlus, ShoppingCart } from 'lucide-react';
import { StatusBadge, type StatusTone } from '@/components/common/status-badge';
import { MoneyText } from '@/components/common/money-text';
import { formatDateTime, formatQuantity } from '@/lib/format';
import type { InventoryTransaction, InventoryType } from '@/features/products/api/types';

const TONE: Record<InventoryType, StatusTone> = {
  PURCHASE: 'success',
  OPENING: 'info',
  SALE: 'neutral',
  WRITE_OFF: 'danger',
  ADJUSTMENT: 'warning',
};

function TypeIcon({ type }: { type: InventoryType }) {
  switch (type) {
    case 'PURCHASE':
      return <ArrowDownLeft className="size-4" aria-hidden />;
    case 'WRITE_OFF':
      return <ArrowUpRight className="size-4" aria-hidden />;
    case 'SALE':
      return <ShoppingCart className="size-4" aria-hidden />;
    case 'OPENING':
      return <PackagePlus className="size-4" aria-hidden />;
    default:
      return <Wrench className="size-4" aria-hidden />;
  }
}

/** Ombor harakatlari ro'yxati — mahsulot sahifasida va ombor tarixida. */
export function TransactionList({
  transactions,
  showProduct = true,
}: {
  transactions: readonly InventoryTransaction[];
  showProduct?: boolean;
}) {
  const { t } = useTranslation('catalog');

  return (
    <ul className="space-y-2">
      {transactions.map((transaction) => (
        <li
          key={transaction.id}
          className="bg-card flex items-start gap-3 rounded-2xl border p-3"
        >
          <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-xl">
            <TypeIcon type={transaction.type} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={TONE[transaction.type]}>
                {t(`inventory.types.${transaction.type}`)}
              </StatusBadge>
              {showProduct && transaction.product ? (
                <span className="truncate text-[15px] font-medium">
                  {transaction.product.name}
                </span>
              ) : null}
            </div>

            <p className="text-muted-foreground mt-1 text-[13px]">
              {formatDateTime(transaction.createdAt)}
            </p>
            {transaction.note ? (
              <p className="text-muted-foreground truncate text-[13px]">{transaction.note}</p>
            ) : null}
          </div>

          <div className="shrink-0 text-right">
            <p className="tabular text-[15px] font-medium">
              {formatQuantity(transaction.quantity, transaction.product?.unit ?? 'dona')}
            </p>
            {transaction.unitPrice ? (
              <MoneyText value={transaction.unitPrice} size="sm" className="text-muted-foreground" />
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
