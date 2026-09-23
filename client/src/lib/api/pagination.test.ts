import { describe, expect, it } from 'vitest';
import { DEFAULT_PAGE_SIZE, emptyPage, hasNextPage, nextPageParam } from './pagination';

describe('sahifalash yordamchilari', () => {
  const meta = (page: number, totalPages: number) => ({
    total: totalPages * 10,
    page,
    limit: 10,
    totalPages,
  });

  it("bo'sh sahifa kontrakt shaklida", () => {
    expect(emptyPage()).toEqual({
      items: [],
      meta: { total: 0, page: 1, limit: DEFAULT_PAGE_SIZE, totalPages: 0 },
    });
  });

  it('oxirgi sahifada keyingisi yo‘q', () => {
    expect(hasNextPage(meta(3, 3))).toBe(false);
    expect(nextPageParam(meta(3, 3))).toBeUndefined();
  });

  it('oraliq sahifada keyingisi bor', () => {
    expect(hasNextPage(meta(2, 5))).toBe(true);
    expect(nextPageParam(meta(2, 5))).toBe(3);
  });

  it("bo'sh ro'yxatda keyingi sahifa so'ralmaydi", () => {
    expect(nextPageParam(emptyPage().meta)).toBeUndefined();
  });
});
