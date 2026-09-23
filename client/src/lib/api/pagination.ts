import type { PaginationMetaDto } from '@/lib/api/generated/model';

/**
 * Sahifalashning YAGONA shakli — barcha ro'yxat endpointlari uchun bir xil
 * (`docs/swagger.json`, "Ro'yxatlar" bo'limi):
 *
 *     { items: [...], meta: { total, page, limit, totalPages } }
 */
export type PageMeta = PaginationMetaDto;

export type Paginated<T> = {
  items: T[];
  meta: PageMeta;
};

export const DEFAULT_PAGE_SIZE = 20;

export function emptyPage<T>(limit = DEFAULT_PAGE_SIZE): Paginated<T> {
  return { items: [], meta: { total: 0, page: 1, limit, totalPages: 0 } };
}

/** Yana yuklanadigan sahifa bormi. */
export function hasNextPage(meta: PageMeta): boolean {
  return meta.page < meta.totalPages;
}

/** Keyingi sahifa raqami yoki `undefined` — `getNextPageParam` uchun. */
export function nextPageParam(meta: PageMeta): number | undefined {
  return hasNextPage(meta) ? meta.page + 1 : undefined;
}
