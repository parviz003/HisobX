import { PAGINATION } from '../dto/pagination-query.dto';

export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

/**
 * `page`/`limit` ni normallashtiradi va Prisma uchun `skip`/`take` beradi.
 * Chegaradan chiqqan qiymatlar (0, manfiy, juda katta limit) xavfsiz
 * standartlarga keltiriladi.
 */
export function pageParams(query?: { page?: number; limit?: number }) {
  const page = Math.max(Number(query?.page) || PAGINATION.DEFAULT_PAGE, 1);
  const limit = Math.min(
    Math.max(Number(query?.limit) || PAGINATION.DEFAULT_LIMIT, 1),
    PAGINATION.MAX_LIMIT,
  );
  return { page, limit, skip: (page - 1) * limit, take: limit };
}

/**
 * Barcha ro'yxat endpointlarining YAGONA javob shakli:
 * `{ items, meta: { total, page, limit, totalPages } }`.
 */
export function paginate<T>(
  items: T[],
  total: number,
  params: { page: number; limit: number },
): Paginated<T> {
  return {
    items,
    meta: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: params.limit > 0 ? Math.ceil(total / params.limit) : 0,
    },
  };
}
