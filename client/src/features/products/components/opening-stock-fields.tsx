import type { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/common/money-input';
import type { ProductFormValues } from '../schemas';

/**
 * Yangi mahsulot uchun ixtiyoriy boshlang'ich qoldiq (topshiriq 3.3).
 * Saqlashda alohida `/inventory/opening` so'rovi yuboriladi.
 */
export function OpeningStockFields({
  form,
  disabled,
}: {
  form: UseFormReturn<ProductFormValues>;
  disabled?: boolean;
}) {
  const { t } = useTranslation('catalog');

  return (
    <div className="bg-muted/50 space-y-3 rounded-xl p-3">
      <div>
        <p className="text-[15px] font-medium">{t('products.opening.title')}</p>
        <p className="text-muted-foreground text-[13px]">{t('products.opening.hint')}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="opening-quantity">{t('products.opening.quantity')}</Label>
        <Input
          id="opening-quantity"
          type="number"
          inputMode="numeric"
          min={0}
          disabled={disabled}
          className="tabular"
          {...form.register('openingQuantity', { valueAsNumber: true })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="opening-price">{t('products.opening.unitPrice')}</Label>
        <MoneyInput
          id="opening-price"
          value={form.getValues('openingUnitPrice') ?? null}
          onChange={(value) => form.setValue('openingUnitPrice', value ?? undefined)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
