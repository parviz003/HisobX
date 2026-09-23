import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useCategories } from '@/features/categories/api/use-categories';
import { cn } from '@/lib/utils';

export type ProductFilterState = {
  categoryId?: string;
  status?: string;
  lowStock?: string;
};

/** Kategoriya chiplari va holat filtrlari (topshiriq 3.2). */
export function ProductFilters({
  filters,
  onChange,
  onClear,
}: {
  filters: ProductFilterState;
  onChange: (key: keyof ProductFilterState, value: string | undefined) => void;
  onClear: () => void;
}) {
  const { t } = useTranslation('catalog');

  const { categories } = useCategories();

  const hasFilters = Boolean(filters.categoryId || filters.status || filters.lowStock);

  const chip = (active: boolean) =>
    cn(
      'min-h-touch shrink-0 rounded-full px-4',
      active ? '' : 'bg-card',
    );

  return (
    <div className="space-y-2">
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          <Button
            type="button"
            size="sm"
            variant={!filters.categoryId ? 'default' : 'outline'}
            className={chip(!filters.categoryId)}
            onClick={() => onChange('categoryId', undefined)}
          >
            {t('products.filters.all')}
          </Button>

          {categories.map((category) => {
            const active = filters.categoryId === String(category.id);
            return (
              <Button
                key={category.id}
                type="button"
                size="sm"
                variant={active ? 'default' : 'outline'}
                className={chip(active)}
                onClick={() => onChange('categoryId', active ? undefined : String(category.id))}
              >
                {category.name}
              </Button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="flex flex-wrap gap-2">
        {(['active', 'inactive'] as const).map((status) => {
          const active = filters.status === status;
          return (
            <Button
              key={status}
              type="button"
              size="sm"
              variant={active ? 'default' : 'outline'}
              className={chip(active)}
              onClick={() => onChange('status', active ? undefined : status)}
            >
              {t(`products.filters.${status}`)}
            </Button>
          );
        })}

        <Button
          type="button"
          size="sm"
          variant={filters.lowStock === 'true' ? 'default' : 'outline'}
          className={chip(filters.lowStock === 'true')}
          onClick={() => onChange('lowStock', filters.lowStock === 'true' ? undefined : 'true')}
        >
          {t('products.filters.lowStock')}
        </Button>

        {hasFilters ? (
          <Button type="button" size="sm" variant="ghost" className="min-h-touch" onClick={onClear}>
            {t('products.filters.clear')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
