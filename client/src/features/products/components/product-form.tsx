import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/common/responsive-dialog';
import { BarcodeScanner } from '@/components/common/barcode-scanner';
import { isApiError } from '@/lib/api/errors';
import { toAmount } from '@/lib/format';
import { useCategories } from '@/features/categories/api/use-categories';
import { inventoryApi } from '@/features/inventory/api/inventory-api';
import { productsApi } from '../api/products-api';
import { inventoryKeys, productKeys } from '../api/queryKeys';
import { productSchema, type ProductFormValues } from '../schemas';
import type { Product } from '../api/types';
import { ProductFormFields } from './product-form-fields';

type ProductFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
};

/** Tahrirlashda formaning boshlang'ich qiymatlari mahsulotdan olinadi. */
function initialValues(product?: Product | null): ProductFormValues {
  return {
    name: product?.name ?? '',
    sellingPrice: product ? toAmount(product.sellingPrice) : 0,
    unit: product?.unit ?? 'dona',
    barcode: product?.barcode ?? '',
    categoryId: product?.categoryId ?? null,
    minStock: product?.minStock ?? 0,
    openingQuantity: undefined,
    openingUnitPrice: undefined,
  };
}

/**
 * Mahsulot qo'shish va tahrirlash oynasi.
 *
 * Komponent dialog har ochilganda QAYTA yig'iladi (`ProductFormDialog` dagi
 * `key`), shuning uchun boshlang'ich qiymatlar `defaultValues` da beriladi —
 * effekt ichida `form.reset()` va `setImage(null)` qilish shart emas.
 */
export function ProductForm({ open, onOpenChange, product }: ProductFormProps) {
  const { t } = useTranslation(['catalog', 'common']);
  const queryClient = useQueryClient();
  const [image, setImage] = useState<File | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const isEdit = Boolean(product);
  const { categories } = useCategories({ enabled: open });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialValues(product),
  });

  const mutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const payload = {
        name: values.name,
        sellingPrice: values.sellingPrice,
        unit: values.unit,
        barcode: values.barcode || undefined,
        categoryId: values.categoryId ?? undefined,
        minStock: values.minStock,
      };

      if (product) return productsApi.update(product.id, payload, image);

      const created = await productsApi.create(payload, image);

      // Ixtiyoriy boshlang'ich qoldiq — mahsulot yaratilgandan keyin alohida so'rov.
      if (values.openingQuantity && values.openingQuantity > 0) {
        try {
          await inventoryApi.opening({
            productId: created.id,
            quantity: values.openingQuantity,
            unitPrice: values.openingUnitPrice,
          });
        } catch {
          // Mahsulot yaratildi — foydalanuvchini bundan xabardor qilamiz.
          toast.warning(t('catalog:products.opening.failed'));
        }
      }
      return created;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: productKeys.all }),
        queryClient.invalidateQueries({ queryKey: inventoryKeys.all }),
      ]);
      toast.success(isEdit ? t('catalog:products.updated') : t('catalog:products.created'));
      onOpenChange(false);
    },
    onError: (error) => {
      if (!isApiError(error) || !error.fieldErrors) return;
      for (const [field, message] of Object.entries(error.fieldErrors)) {
        if (field in form.getValues()) {
          form.setError(field as keyof ProductFormValues, { message });
        }
      }
    },
  });

  return (
    <>
      <ResponsiveDialog
        open={open}
        onOpenChange={onOpenChange}
        title={isEdit ? t('common:actions.edit') : t('catalog:products.add')}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button form="product-form" type="submit" disabled={mutation.isPending}>
              {t('common:actions.save')}
            </Button>
          </>
        }
      >
        <form
          id="product-form"
          noValidate
          onSubmit={(event) => void form.handleSubmit((values) => mutation.mutate(values))(event)}
          className="space-y-4 py-2"
        >
          <ProductFormFields
            form={form}
            categories={categories}
            product={product}
            image={image}
            onImageChange={setImage}
            onScanRequest={() => setScannerOpen(true)}
            disabled={mutation.isPending}
          />
        </form>
      </ResponsiveDialog>

      <BarcodeScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onDetected={(code) => form.setValue('barcode', code)}
      />
    </>
  );
}
