import { useQuery } from '@tanstack/react-query';
import { categoryKeys } from '@/features/products/api/queryKeys';
import type { Category } from '@/features/products/api/types';
import { categoriesApi } from './categories-api';

/** Tanlov ro'yxatlari uchun yetarli — do'konda bundan ko'p toifa bo'lmaydi. */
const CATEGORY_LIMIT = 100;

/**
 * Toifalar ro'yxati BITTA joydan olinadi: filtrlar, mahsulot formasi va
 * toifalar sahifasi ham shu hookni ishlatadi.
 */
export function useCategories(options: { enabled?: boolean } = {}) {
  const query = useQuery({
    queryKey: categoryKeys.list(),
    queryFn: ({ signal }) => categoriesApi.list({ limit: CATEGORY_LIMIT }, signal),
    enabled: options.enabled,
  });

  const categories: Category[] = query.data?.items ?? [];

  return { ...query, categories };
}
