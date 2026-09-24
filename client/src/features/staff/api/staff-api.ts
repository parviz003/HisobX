import { api } from '@/lib/api/client';
import type { StaffInput, StaffUpdateInput, StaffUser } from './types';

export const staffKeys = {
  all: ['staff'] as const,
  list: () => [...staffKeys.all, 'list'] as const,
};

export const staffApi = {
  list: async (signal?: AbortSignal): Promise<StaffUser[]> => {
    const { data } = await api.get<any>('/users', {
      params: { limit: 100 },
      signal,
    });
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  },

  create: async (values: StaffInput): Promise<StaffUser> => {
    const { data } = await api.post<StaffUser>('/users', values);
    return data;
  },

  update: async (id: number, values: StaffUpdateInput): Promise<StaffUser> => {
    const { data } = await api.patch<StaffUser>(`/users/${id}`, values);
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};
