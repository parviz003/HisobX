import { useTranslation } from 'react-i18next';
import { StatusBadge } from '@/components/common/status-badge';
import type { Product } from '../api/types';

/** Qoldiq holati: tugagan (rose), kam qolgan (amber), nofaol (kulrang). */
export function ProductBadges({ product }: { product: Pick<Product, 'stock' | 'minStock' | 'isActive'> }) {
  const { t } = useTranslation('catalog');

  const out = product.stock <= 0;
  const low = !out && product.stock <= product.minStock;

  return (
    <>
      {out ? <StatusBadge tone="danger">{t('products.badges.out')}</StatusBadge> : null}
      {low ? <StatusBadge tone="warning">{t('products.badges.low')}</StatusBadge> : null}
      {!product.isActive ? (
        <StatusBadge tone="neutral">{t('products.badges.inactive')}</StatusBadge>
      ) : null}
    </>
  );
}

/** Mahsulot "kam qolgan"mi (mijoz tomonda filtr uchun). */
export function isLowStock(product: Pick<Product, 'stock' | 'minStock'>): boolean {
  return product.stock <= product.minStock;
}
