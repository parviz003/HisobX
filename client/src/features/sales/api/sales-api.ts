import { api } from '@/lib/api/client';
import type { Paginated } from '@/lib/api/pagination';
import type { Sale, SaleQuery } from './types';

export const saleKeys = {
  all: ['sales'] as const,
  lists: () => [...saleKeys.all, 'list'] as const,
  list: (query: SaleQuery) => [...saleKeys.lists(), query] as const,
  detail: (id: number) => [...saleKeys.all, 'detail', id] as const,
};

export const salesApi = {
  list: async (query: SaleQuery = {}, signal?: AbortSignal): Promise<Paginated<Sale>> => {
    const { data } = await api.get<Paginated<Sale>>('/sales', {
      params: query,
      signal,
    });
    return data;
  },

  byId: async (id: number, signal?: AbortSignal): Promise<Sale> => {
    const { data } = await api.get<Sale>(`/sales/${id}`, { signal });
    return data;
  },

  cancel: async (id: number): Promise<Sale> => {
    const { data } = await api.patch<Sale>(`/sales/${id}/cancel`);
    return data;
  },
};
