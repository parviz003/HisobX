import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResponsiveDialog } from '@/components/common/responsive-dialog';
import { MoneyInput } from '@/components/common/money-input';
import { MoneyText } from '@/components/common/money-text';
import { isApiError } from '@/lib/api/errors';
import { inventoryKeys, productKeys } from '@/features/products/api/queryKeys';
import type { Product } from '@/features/products/api/types';
import { inventoryApi } from '../api/inventory-api';
import { ProductPicker } from './product-picker';

type Row = {
  key: number;
  product: Product | null;
  quantity: number | null;
  unitPrice: number | null;
};

let nextKey = 1;
const emptyRow = (): Row => ({ key: nextKey++, product: null, quantity: null, unitPrice: null });

/**
 * Kirim (PURCHASE) — bir nechta qatorni ketma-ket qo'shish mumkin.
 * Har qator ALOHIDA so'rov sifatida yuboriladi (backend bitta qatorni kutadi),
 * natija umumiy ko'rsatiladi (topshiriq 3.6).
 */
export function PurchaseDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation(['catalog', 'common']);
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [errors, setErrors] = useState<Record<number, string>>({});

  const patchRow = (key: number, patch: Partial<Row>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const total = rows.reduce(
    (sum, row) => sum + (row.quantity ?? 0) * (row.unitPrice ?? 0),
    0,
  );

  const valid = rows.filter((row) => row.product && row.quantity && row.quantity > 0);

  const mutation = useMutation({
    mutationFn: async () => {
      const failures: Record<number, string> = {};
      let done = 0;

      for (const row of valid) {
        try {
          await inventoryApi.purchase({
            productId: row.product!.id,
            quantity: row.quantity!,
            unitPrice: row.unitPrice ?? undefined,
          });
          done += 1;
        } catch (error) {
          failures[row.key] = isApiError(error) ? error.message : t('common:state.errorTitle');
        }
      }

      return { done, failures };
    },
    onSuccess: async ({ done, failures }) => {
      setErrors(failures);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: inventoryKeys.all }),
        queryClient.invalidateQueries({ queryKey: productKeys.all }),
      ]);

      const failed = Object.keys(failures).length;
      if (failed === 0) {
        toast.success(t('catalog:inventory.purchaseDone', { count: done }));
        setRows([emptyRow()]);
        onOpenChange(false);
      } else {
        toast.warning(t('catalog:inventory.purchasePartial', { done, failed }));
      }
    },
  });

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('catalog:inventory.purchase')}
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
            className="min-h-touch"
            disabled={valid.length === 0 || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {t('catalog:inventory.submitPurchase')}
          </Button>
        </>
      }
    >
      <div className="space-y-4 py-2">
        {rows.map((row, index) => (
          <div key={row.key} className="bg-muted/40 space-y-3 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium">#{index + 1}</p>
              {rows.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={t('catalog:inventory.removeRow')}
                  onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))}
                >
                  <X className="size-4" />
                </Button>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>{t('catalog:inventory.product')}</Label>
              <ProductPicker
                value={row.product}
                onChange={(product) => patchRow(row.key, { product })}
                disabled={mutation.isPending}
              />
              {row.product ? (
                <p className="text-muted-foreground text-[13px]">
                  {t('catalog:inventory.currentStock', { value: row.product.stock })}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor={`qty-${row.key}`}>{t('catalog:inventory.quantity')}</Label>
                <Input
                  id={`qty-${row.key}`}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  className="tabular"
                  disabled={mutation.isPending}
                  value={row.quantity ?? ''}
                  onChange={(event) =>
                    patchRow(row.key, {
                      quantity: event.target.value === '' ? null : Number(event.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`price-${row.key}`}>{t('catalog:inventory.unitPrice')}</Label>
                <MoneyInput
                  id={`price-${row.key}`}
                  value={row.unitPrice}
                  onChange={(value) => patchRow(row.key, { unitPrice: value })}
                  disabled={mutation.isPending}
                />
              </div>
            </div>

            {errors[row.key] ? (
              <p role="alert" className="text-destructive text-[13px]">
                {errors[row.key]}
              </p>
            ) : null}
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          className="min-h-touch w-full"
          disabled={mutation.isPending}
          onClick={() => setRows((current) => [...current, emptyRow()])}
        >
          <Plus className="size-4" aria-hidden />
          {t('catalog:inventory.addRow')}
        </Button>

        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-[15px] font-medium">{t('catalog:inventory.total')}</span>
          <MoneyText value={total} size="lg" />
        </div>

        {/* TODO(backend) 5.2-4: quantity hozir faqat butun son. */}
        <p className="text-muted-foreground text-[13px]">
          {t('catalog:inventory.integerOnly')}
        </p>
      </div>
    </ResponsiveDialog>
  );
}
