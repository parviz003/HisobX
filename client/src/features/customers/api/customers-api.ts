import { api } from '@/lib/api/client';
import type { Paginated } from '@/lib/api/pagination';
import type { Customer, CustomerDetail, CustomerInput, CustomerQuery } from './types';

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (query: CustomerQuery) => [...customerKeys.lists(), query] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: number) => [...customerKeys.details(), id] as const,
};

export const customersApi = {
  list: async (query: CustomerQuery = {}, signal?: AbortSignal): Promise<Paginated<Customer>> => {
    const { data } = await api.get<Paginated<Customer>>('/customers', {
      params: query,
      signal,
    });
    return data;
  },

  byId: async (id: number, signal?: AbortSignal): Promise<CustomerDetail> => {
    const { data } = await api.get<CustomerDetail>(`/customers/${id}`, { signal });
    return data;
  },

  create: async (values: CustomerInput): Promise<Customer> => {
    const { data } = await api.post<Customer>('/customers', values);
    return data;
  },

  update: async (id: number, values: Partial<CustomerInput>): Promise<Customer> => {
    const { data } = await api.patch<Customer>(`/customers/${id}`, values);
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },
};
