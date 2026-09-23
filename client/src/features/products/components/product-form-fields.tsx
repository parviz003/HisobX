import type { UseFormReturn } from 'react-hook-form';
import { ScanLine } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageUpload } from '@/components/common/image-upload';
import { MoneyInput } from '@/components/common/money-input';
import { resolveImageUrl } from '@/lib/image-url';
import type { Category, Product } from '../api/types';
import type { ProductFormValues } from '../schemas';
import { UnitSelect } from './unit-select';
import { OpeningStockFields } from './opening-stock-fields';

const NO_CATEGORY = 'none';

type ProductFormFieldsProps = {
  form: UseFormReturn<ProductFormValues>;
  categories: Category[];
  product?: Product | null;
  image: File | null;
  onImageChange: (file: File | null) => void;
  onScanRequest: () => void;
  disabled: boolean;
};

/** Mahsulot formasining maydonlari. Holat va so'rovlar — `ProductForm` da. */
export function ProductFormFields({
  form,
  categories,
  product,
  image,
  onImageChange,
  onScanRequest,
  disabled,
}: ProductFormFieldsProps) {
  const { t } = useTranslation(['catalog', 'common', 'auth']);
  const isEdit = Boolean(product);

  const unit = form.watch('unit');
  const sellingPrice = form.watch('sellingPrice');
  const categoryId = form.watch('categoryId');

  const errorFor = (field: keyof ProductFormValues) => {
    const message = form.formState.errors[field]?.message;
    if (!message) return null;
    return (
      <p role="alert" className="text-destructive text-[13px]">
        {message.startsWith('validation.') ? t(`auth:${message}`) : message}
      </p>
    );
  };

  return (
    <>
      <ImageUpload
        label={t('catalog:products.fields.image')}
        currentUrl={resolveImageUrl(product?.imageUrl) ?? null}
        file={image}
        onFileChange={onImageChange}
        disabled={disabled}
      />

      <div className="space-y-2">
        <Label htmlFor="product-name">{t('catalog:products.fields.name')}</Label>
        <Input
          id="product-name"
          autoComplete="off"
          disabled={disabled}
          aria-invalid={Boolean(form.formState.errors.name)}
          {...form.register('name')}
        />
        {errorFor('name')}
      </div>

      <div className="space-y-2">
        <Label htmlFor="product-barcode">{t('catalog:products.fields.barcode')}</Label>
        <div className="flex gap-2">
          <Input
            id="product-barcode"
            inputMode="numeric"
            autoComplete="off"
            disabled={disabled}
            {...form.register('barcode')}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            aria-label={t('catalog:products.scan')}
            onClick={onScanRequest}
          >
            <ScanLine className="size-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('catalog:products.fields.unit')}</Label>
        <UnitSelect
          value={unit}
          onChange={(next) => form.setValue('unit', next)}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="product-category">{t('catalog:products.fields.category')}</Label>
        <Select
          value={categoryId ? String(categoryId) : NO_CATEGORY}
          onValueChange={(value) =>
            form.setValue('categoryId', value === NO_CATEGORY ? null : Number(value))
          }
          disabled={disabled}
        >
          <SelectTrigger id="product-category" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_CATEGORY}>{t('catalog:products.fields.noCategory')}</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={String(category.id)}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="product-price">{t('catalog:products.fields.sellingPrice')}</Label>
        <MoneyInput
          id="product-price"
          value={sellingPrice || null}
          onChange={(value) => form.setValue('sellingPrice', value ?? 0)}
          disabled={disabled}
          aria-invalid={Boolean(form.formState.errors.sellingPrice)}
        />
        {errorFor('sellingPrice')}
      </div>

      <div className="space-y-2">
        <Label htmlFor="product-min-stock">{t('catalog:products.fields.minStock')}</Label>
        <Input
          id="product-min-stock"
          type="number"
          inputMode="numeric"
          min={0}
          disabled={disabled}
          className="tabular"
          {...form.register('minStock', { valueAsNumber: true })}
        />
      </div>

      {/* Boshlang'ich qoldiq faqat yangi mahsulotda so'raladi. */}
      {!isEdit ? <OpeningStockFields form={form} disabled={disabled} /> : null}

      {/* TODO(backend): CreateProductDto'da `isActive` yo'q. */}
      <p className="text-muted-foreground text-[13px]">{t('catalog:products.inactiveNotice')}</p>
    </>
  );
}
