import { useMemo } from 'react';
import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query';
import {
  DEFAULT_PAGE_SIZE,
  nextPageParam,
  type PageMeta,
  type Paginated,
} from '@/lib/api/pagination';

type PageRequest = {
  page: number;
  limit: number;
  signal?: AbortSignal;
};

type UsePaginatedQueryOptions<T> = {
  queryKey: QueryKey;
  /** Bitta sahifani oladi. Javob kontrakt shaklida bo'lishi shart. */
  fetchPage: (request: PageRequest) => Promise<Paginated<T>>;
  limit?: number;
  enabled?: boolean;
};

/**
 * Sahifalanadigan ro'yxatlar uchun YAGONA hook.
 *
 * Har feature'da `useInfiniteQuery` ni qaytadan sozlash o'rniga shu ishlatiladi:
 * telefonda "Ko'proq yuklash", desktopda jadval — ikkalasi ham bir xil manbadan.
 * Sahifa hisobi `meta` dan olinadi, ya'ni ro'yxat qancha ekanini frontend
 * o'zi hisoblamaydi.
 */
export function usePaginatedQuery<T>({
  queryKey,
  fetchPage,
  limit = DEFAULT_PAGE_SIZE,
  enabled,
}: UsePaginatedQueryOptions<T>) {
  const query = useInfiniteQuery({
    queryKey,
    enabled,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => fetchPage({ page: pageParam, limit, signal }),
    getNextPageParam: (lastPage) => nextPageParam(lastPage.meta),
  });

  const items = useMemo<T[]>(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  );

  const meta: PageMeta | undefined = query.data?.pages.at(-1)?.meta;

  return {
    ...query,
    items,
    meta,
    /** Serverdagi jami yozuvlar soni (yuklanganlari emas). */
    total: meta?.total ?? 0,
  };
}
