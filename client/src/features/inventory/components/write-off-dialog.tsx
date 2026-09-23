import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ResponsiveDialog } from '@/components/common/responsive-dialog';
import { isApiError } from '@/lib/api/errors';
import { formatQuantity } from '@/lib/format';
import { inventoryKeys, productKeys } from '@/features/products/api/queryKeys';
import type { Product } from '@/features/products/api/types';
import { inventoryApi } from '../api/inventory-api';
import { ProductPicker } from './product-picker';

/** Hisobdan chiqarish (WRITE_OFF): miqdor qoldiqdan oshmaydi, sabab so'raladi. */
export function WriteOffDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation(['catalog', 'common']);
  const queryClient = useQueryClient();

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setProduct(null);
    setQuantity(null);
    setNote('');
    setError(null);
  };

  const mutation = useMutation({
    mutationFn: () =>
      inventoryApi.writeOff({
        productId: product!.id,
        quantity: quantity!,
        note: note.trim() || undefined,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: inventoryKeys.all }),
        queryClient.invalidateQueries({ queryKey: productKeys.all }),
      ]);
      toast.success(t('catalog:inventory.writeOffDone'));
      reset();
      onOpenChange(false);
    },
    onError: (err) => {
      // Backend zaxira xatosini tushunarli o'zbekcha matn bilan qaytaradi.
      setError(isApiError(err) ? err.message : t('common:state.errorTitle'));
    },
    meta: { silentStatuses: [400] },
  });

  const exceedsStock = product !== null && quantity !== null && quantity > product.stock;
  const canSubmit =
    product !== null && quantity !== null && quantity > 0 && !exceedsStock && !mutation.isPending;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
      title={t('catalog:inventory.writeOff')}
      footer={
        <>
          <Button
            variant="outline"
            className="min-h-touch"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            {t('common:actions.cancel')}
          </Button>
          <Button
            variant="destructive"
            className="min-h-touch"
            disabled={!canSubmit}
            onClick={() => mutation.mutate()}
          >
            {t('catalog:inventory.submitWriteOff')}
          </Button>
        </>
      }
    >
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label>{t('catalog:inventory.product')}</Label>
          <ProductPicker value={product} onChange={setProduct} disabled={mutation.isPending} />
          {product ? (
            <p className="text-muted-foreground text-[13px]">
              {t('catalog:inventory.currentStock', {
                value: formatQuantity(product.stock, product.unit),
              })}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="writeoff-qty">{t('catalog:inventory.quantity')}</Label>
          <Input
            id="writeoff-qty"
            type="number"
            inputMode="numeric"
            min={1}
            max={product?.stock}
            className="tabular"
            disabled={mutation.isPending || !product}
            aria-invalid={exceedsStock}
            value={quantity ?? ''}
            onChange={(event) =>
              setQuantity(event.target.value === '' ? null : Number(event.target.value))
            }
          />
          {exceedsStock ? (
            <p role="alert" className="text-destructive text-[13px]">
              {t('catalog:inventory.currentStock', {
                value: formatQuantity(product.stock, product.unit),
              })}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="writeoff-note">{t('catalog:inventory.reason')}</Label>
          <Textarea
            id="writeoff-note"
            rows={3}
            disabled={mutation.isPending}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>

        {error ? (
          <p role="alert" className="text-destructive text-[13px]">
            {error}
          </p>
        ) : null}
      </div>
    </ResponsiveDialog>
  );
}
