import { api } from '@/lib/api/client';
import type { Paginated } from '@/lib/api/pagination';
import type { Category } from '@/features/products/api/types';

export type CategoryQuery = { page?: number; limit?: number; search?: string };

export const categoriesApi = {
  list: async (query: CategoryQuery = {}, signal?: AbortSignal): Promise<Paginated<Category>> => {
    const { data } = await api.get<Paginated<Category>>('/categories', {
      params: query,
      signal,
    });
    return data;
  },

  create: async (name: string): Promise<Category> => {
    const { data } = await api.post<Category>('/categories', { name });
    return data;
  },

  update: async (id: number, name: string): Promise<Category> => {
    const { data } = await api.patch<Category>(`/categories/${id}`, { name });
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};
