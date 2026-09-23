import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Package, Plus, ScanLine } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { SearchInput } from '@/components/common/search-input';
import { BarcodeScanner } from '@/components/common/barcode-scanner';
import { useCan } from '@/hooks/use-can';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import { productsApi } from '../api/products-api';
import { productKeys } from '../api/queryKeys';
import type { Product } from '../api/types';
import { ProductCard } from '../components/product-card';
import { isLowStock } from '../components/product-badges';
import { ProductFilters } from '../components/product-filters';
import { ProductFormDialog } from '../components/product-form-dialog';

const DEFAULTS = { search: '', categoryId: '', status: '', lowStock: '' };

/** Mahsulotlar ro'yxati. SELLER faqat ko'radi, tahrirlash tugmalarini ko'rmaydi. */
export default function ProductsPage() {
  const { t } = useTranslation(['catalog', 'common']);
  const navigate = useNavigate();
  const canManage = useCan('catalog.manage');

  const { filters, setFilter, clearFilters } = useUrlFilters(DEFAULTS);
  const [formOpen, setFormOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const listQuery = {
    search: filters.search || undefined,
    categoryId: filters.categoryId ? Number(filters.categoryId) : undefined,
    isActive: filters.status ? filters.status === 'active' : undefined,
  };

  const query = usePaginatedQuery({
    queryKey: productKeys.list(listQuery),
    fetchPage: ({ page, limit, signal }) =>
      productsApi.list({ page, limit, ...listQuery }, signal),
  });

  const products: Product[] = useMemo(() => {
    // TODO(backend): /products da `lowStock` query parametri yo'q — shuning uchun
    // bu filtr YUKLANGAN sahifalar ustida ishlaydi.
    return filters.lowStock === 'true' ? query.items.filter(isLowStock) : query.items;
  }, [query.items, filters.lowStock]);

  const handleScan = (code: string) => {
    setFilter('search', code);
    // TODO(backend): `search` faqat nom bo'yicha qidiradi, barcode bo'yicha emas.
    toast.info(t('catalog:products.notFoundByBarcode'));
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('catalog:products.title')}
        description={t('catalog:products.subtitle')}
        actions={
          canManage ? (
            <Button className="min-h-touch" onClick={() => setFormOpen(true)}>
              <Plus className="size-4" aria-hidden />
              <span className="hidden sm:inline">{t('catalog:products.add')}</span>
            </Button>
          ) : null
        }
      />

      <div className="flex gap-2">
        <SearchInput
          className="flex-1"
          value={filters.search}
          onDebouncedChange={(value) => setFilter('search', value)}
          placeholder={t('catalog:products.searchPlaceholder')}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="min-h-touch shrink-0"
          aria-label={t('catalog:products.scan')}
          onClick={() => setScannerOpen(true)}
        >
          <ScanLine className="size-5" />
        </Button>
      </div>

      <ProductFilters
        filters={filters}
        onChange={(key, value) => setFilter(key, value)}
        onClear={clearFilters}
      />

      {query.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t('catalog:products.empty')}
          description={t('catalog:products.emptyHint')}
          action={
            canManage ? (
              <Button className="min-h-touch" onClick={() => setFormOpen(true)}>
                <Plus className="size-4" aria-hidden />
                {t('catalog:products.add')}
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          <ul className="space-y-2">
            {products.map((product) => (
              <li key={product.id}>
                <button
                  type="button"
                  onClick={() => void navigate(`/products/${product.id}`)}
                  className="focus-visible:ring-ring w-full rounded-2xl text-left focus-visible:ring-2 focus-visible:outline-none"
                >
                  <ProductCard product={product} />
                </button>
              </li>
            ))}
          </ul>

          {query.hasNextPage ? (
            <Button
              variant="outline"
              className="min-h-touch w-full"
              disabled={query.isFetchingNextPage}
              onClick={() => void query.fetchNextPage()}
            >
              {t('common:actions.loadMore')}
            </Button>
          ) : null}
        </>
      )}

      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <BarcodeScanner open={scannerOpen} onOpenChange={setScannerOpen} onDetected={handleScan} />
    </div>
  );
}
