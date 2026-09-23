import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Package, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ErrorState } from '@/components/common/error-state';
import { EmptyState } from '@/components/common/empty-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { MoneyText } from '@/components/common/money-text';
import { useCan } from '@/hooks/use-can';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import { formatPercent, formatQuantity, toAmount } from '@/lib/format';
import { resolveImageUrl } from '@/lib/image-url';
import { inventoryApi } from '@/features/inventory/api/inventory-api';
import { TransactionList } from '@/features/inventory/components/transaction-list';
import { productsApi } from '../api/products-api';
import { inventoryKeys, productKeys } from '../api/queryKeys';
import { ProductBadges } from '../components/product-badges';
import { ProductFormDialog } from '../components/product-form-dialog';

/**
 * Ustama foizi — sotish narxining oxirgi kirim narxidan qancha yuqoriligi.
 * TODO(backend): backend bu qiymatni bermaydi, shuning uchun ko'rsatish uchun
 * ikkita mavjud raqamdan hisoblanadi. Foyda hisob-kitobi BU EMAS.
 */
function markupPercent(sellingPrice: number, lastPurchasePrice: number): number | null {
  const cost = toAmount(lastPurchasePrice);
  if (cost <= 0) return null;
  return ((toAmount(sellingPrice) - cost) / cost) * 100;
}

export default function ProductDetailPage() {
  const { t } = useTranslation(['catalog', 'common']);
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const canManage = useCan('catalog.manage');
  const canSeeCost = useCan('cost.view');

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const productId = Number(id);

  const query = useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: ({ signal }) => productsApi.byId(productId, signal),
    enabled: Number.isFinite(productId),
  });

  const history = usePaginatedQuery({
    queryKey: inventoryKeys.transactions({ productId }),
    fetchPage: ({ page, limit, signal }) =>
      inventoryApi.transactions({ page, limit, productId }, signal),
    enabled: Number.isFinite(productId),
  });

  const removeMutation = useMutation({
    mutationFn: () => productsApi.remove(productId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: productKeys.all });
      toast.success(t('catalog:products.deleted'));
      void navigate('/products', { replace: true });
    },
  });

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return <ErrorState onRetry={() => void query.refetch()} />;
  }

  const product = query.data;
  const image = resolveImageUrl(product.imageUrl);
  const markup = markupPercent(product.sellingPrice, product.lastPurchasePrice);
  const transactions = history.items;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="min-h-touch"
          aria-label={t('common:actions.back')}
          onClick={() => void navigate(-1)}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="min-w-0 flex-1 truncate text-[22px] font-semibold">{product.name}</h1>

        {canManage ? (
          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="min-h-touch"
              aria-label={t('common:actions.edit')}
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="min-h-touch text-destructive"
              aria-label={t('common:actions.delete')}
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>

      <Card className="overflow-hidden rounded-2xl">
        <div className="bg-muted flex aspect-[16/9] items-center justify-center">
          {image ? (
            <img src={image} alt="" className="size-full object-cover" loading="lazy" />
          ) : (
            <Package className="text-muted-foreground size-12" aria-hidden />
          )}
        </div>

        <CardContent className="space-y-3 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <ProductBadges product={product} />
          </div>

          <dl className="space-y-2">
            <Row label={t('catalog:products.fields.sellingPrice')}>
              <MoneyText value={product.sellingPrice} size="lg" />
            </Row>

            <Row label={t('catalog:products.fields.stock')}>
              <span className="tabular text-[15px] font-medium">
                {formatQuantity(product.stock, product.unit)}
              </span>
            </Row>

            <Row label={t('catalog:products.fields.minStock')}>
              <span className="tabular text-[15px]">
                {formatQuantity(product.minStock, product.unit)}
              </span>
            </Row>

            <Row label={t('catalog:products.fields.category')}>
              <span className="text-[15px]">
                {product.category?.name ?? t('catalog:products.fields.noCategory')}
              </span>
            </Row>

            {product.barcode ? (
              <Row label={t('catalog:products.fields.barcode')}>
                <span className="tabular text-[15px]">{product.barcode}</span>
              </Row>
            ) : null}

            {/* Tannarx va ustama faqat MANAGER/ADMIN uchun (SELLER ko'rmaydi). */}
            {canSeeCost ? (
              <>
                <Separator className="my-1" />
                <Row label={t('catalog:products.fields.lastPurchasePrice')}>
                  <MoneyText value={product.lastPurchasePrice} size="md" />
                </Row>
                {markup !== null ? (
                  <Row label={t('catalog:products.fields.markup')}>
                    <span className="tabular text-money-in text-[15px] font-medium">
                      {formatPercent(markup)}
                    </span>
                  </Row>
                ) : null}
              </>
            ) : null}
          </dl>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">{t('catalog:products.history')}</CardTitle>
        </CardHeader>
        <CardContent>
          {history.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState title={t('catalog:inventory.emptyHistory')} />
          ) : (
            <TransactionList transactions={transactions} showProduct={false} />
          )}
        </CardContent>
      </Card>

      <ProductFormDialog open={editOpen} onOpenChange={setEditOpen} product={product} />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t('catalog:products.deleteTitle')}
        description={t('catalog:products.deleteBody')}
        confirmLabel={t('common:actions.delete')}
        destructive
        loading={removeMutation.isPending}
        onConfirm={() => removeMutation.mutate()}
      />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground text-[13px]">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
