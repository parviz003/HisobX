import { useState } from 'react';
import type { Product } from '../api/types';
import { ProductForm } from './product-form';

type ProductFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
};

/**
 * Formani har ochilganda toza holatda ko'taradi.
 *
 * `key` o'zgarganda `ProductForm` qaytadan yig'iladi — ya'ni maydonlar va
 * tanlangan rasm o'z-o'zidan boshlang'ich holatga qaytadi. Shuning uchun
 * effekt ichida holat o'zgartirilmaydi (`react-hooks/set-state-in-effect`),
 * yopilish animatsiyasi esa saqlanadi: yopilganda komponent yechilmaydi.
 */
export function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
  const [wasOpen, setWasOpen] = useState(open);
  const [instance, setInstance] = useState(0);

  // React'ning "render paytida holatni moslash" naqshi — effekt emas.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setInstance((value) => value + 1);
  }

  return <ProductForm key={instance} open={open} onOpenChange={onOpenChange} product={product} />;
}
