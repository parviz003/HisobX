import { useMemo, useState } from 'react';

import { Warehouse, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { StatusBadge } from '@/components/common/status-badge';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { INVENTORY_TYPES, type InventoryType } from '@/features/products/api/types';
import { inventoryKeys } from '@/features/products/api/queryKeys';
import { inventoryApi } from '../api/inventory-api';
import { TransactionList } from '../components/transaction-list';
import { PurchaseDialog } from '../components/purchase-dialog';
import { WriteOffDialog } from '../components/write-off-dialog';

const ALL_TYPES = 'all';
const DEFAULTS = { tab: 'stock', type: '' };

/** Ombor: qoldiqlar va harakatlar tarixi (MANAGER, ADMIN). */
export default function InventoryPage() {
  const { t } = useTranslation(['catalog', 'common']);
  const { filters, setFilter } = useUrlFilters(DEFAULTS);

  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [writeOffOpen, setWriteOffOpen] = useState(false);

  const stock = usePaginatedQuery({
    queryKey: inventoryKeys.stock(),
    fetchPage: ({ page, limit, signal }) => inventoryApi.stock({ page, limit }, signal),
  });

  const selectedType = filters.type as InventoryType | '';

  const history = usePaginatedQuery({
    queryKey: inventoryKeys.transactions({ type: selectedType || undefined }),
    fetchPage: ({ page, limit, signal }) =>
      inventoryApi.transactions({ page, limit, type: selectedType || undefined }, signal),
    enabled: filters.tab === 'history',
  });

  // Kam qolganlar yuqorida (topshiriq 3.6).
  const rows = useMemo(() => {
    // TODO(backend): `/inventory/stock` da saralash yo'q — yuklangan sahifalar saralanadi.
    return [...stock.items].sort(
      (a, b) => Number(b.lowStock) - Number(a.lowStock) || a.stock - b.stock,
    );
  }, [stock.items]);

  const transactions = history.items;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('catalog:inventory.title')}
        description={t('catalog:inventory.subtitle')}
      />

      <div className="grid grid-cols-2 gap-2">
        <Button className="min-h-touch" onClick={() => setPurchaseOpen(true)}>
          <ArrowDownLeft className="size-4" aria-hidden />
          {t('catalog:inventory.purchase')}
        </Button>
        <Button variant="outline" className="min-h-touch" onClick={() => setWriteOffOpen(true)}>
          <ArrowUpRight className="size-4" aria-hidden />
          {t('catalog:inventory.writeOff')}
        </Button>
      </div>

      <Tabs value={filters.tab} onValueChange={(value) => setFilter('tab', value)}>
        <TabsList className="w-full">
          <TabsTrigger value="stock" className="min-h-touch flex-1">
            {t('catalog:inventory.tabs.stock')}
          </TabsTrigger>
          <TabsTrigger value="history" className="min-h-touch flex-1">
            {t('catalog:inventory.tabs.history')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-4">
          {stock.isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          ) : stock.isError ? (
            <ErrorState onRetry={() => void stock.refetch()} />
          ) : rows.length === 0 ? (
            <EmptyState icon={Warehouse} title={t('catalog:inventory.emptyStock')} />
          ) : (
            <ul className="space-y-2">
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="bg-card flex items-center gap-3 rounded-2xl border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{row.name}</p>
                    <p className="text-muted-foreground tabular text-[13px]">
                      {/* TODO(backend): /inventory/stock javobida `unit` yo'q. */}
                      {row.stock} · min {row.minStock}
                    </p>
                  </div>
                  {row.stock <= 0 ? (
                    <StatusBadge tone="danger">{t('catalog:products.badges.out')}</StatusBadge>
                  ) : row.lowStock ? (
                    <StatusBadge tone="warning">{t('catalog:products.badges.low')}</StatusBadge>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-3">
          <Select
            value={filters.type || ALL_TYPES}
            onValueChange={(value) => setFilter('type', value === ALL_TYPES ? undefined : value)}
          >
            <SelectTrigger className="min-h-touch w-full sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_TYPES}>{t('catalog:inventory.filters.allTypes')}</SelectItem>
              {INVENTORY_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`catalog:inventory.types.${type}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {history.isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          ) : history.isError ? (
            <ErrorState onRetry={() => void history.refetch()} />
          ) : transactions.length === 0 ? (
            <EmptyState title={t('catalog:inventory.emptyHistory')} />
          ) : (
            <TransactionList transactions={transactions} />
          )}
        </TabsContent>
      </Tabs>

      <PurchaseDialog open={purchaseOpen} onOpenChange={setPurchaseOpen} />
      <WriteOffDialog open={writeOffOpen} onOpenChange={setWriteOffOpen} />
    </div>
  );
}
