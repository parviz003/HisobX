import { Package } from 'lucide-react';
import { MoneyText } from '@/components/common/money-text';
import { formatQuantity } from '@/lib/format';
import { resolveImageUrl } from '@/lib/image-url';
import { cn } from '@/lib/utils';
import type { Product } from '../api/types';
import { ProductBadges } from './product-badges';

/** Telefon uchun mahsulot kartasi: rasm, nom, narx, qoldiq va holat. */
export function ProductCard({
  product,
  showStock = true,
  className,
}: {
  product: Product;
  showStock?: boolean;
  className?: string;
}) {
  const image = resolveImageUrl(product.imageUrl);

  return (
    <div className={cn('bg-card flex items-start gap-3 rounded-2xl border p-3', className)}>
      <div className="bg-muted flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl">
        {image ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            width={64}
            height={64}
            className="size-full object-cover"
          />
        ) : (
          <Package className="text-muted-foreground size-6" aria-hidden />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium">{product.name}</p>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <MoneyText value={product.sellingPrice} size="md" className="font-semibold" />
          {showStock ? (
            <span className="text-muted-foreground tabular text-[13px]">
              {formatQuantity(product.stock, product.unit)}
            </span>
          ) : null}
        </div>

        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <ProductBadges product={product} />
        </div>
      </div>
    </div>
  );
}
