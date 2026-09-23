import { api } from '@/lib/api/client';
import type { Paginated } from '@/lib/api/pagination';
import type { Debt, DebtDetail, DebtPaymentInput, DebtQuery, OverdueGroup } from './types';

export const debtKeys = {
  all: ['debts'] as const,
  lists: () => [...debtKeys.all, 'list'] as const,
  list: (query: DebtQuery) => [...debtKeys.lists(), query] as const,
  overdue: () => [...debtKeys.all, 'overdue'] as const,
  detail: (id: number) => [...debtKeys.all, 'detail', id] as const,
};

export const debtsApi = {
  list: async (query: DebtQuery = {}, signal?: AbortSignal): Promise<Paginated<Debt>> => {
    const { data } = await api.get<Paginated<Debt>>('/debts', {
      params: query,
      signal,
    });
    return data;
  },

  overdue: async (signal?: AbortSignal): Promise<OverdueGroup[]> => {
    const { data } = await api.get<OverdueGroup[]>('/debts/overdue', { signal });
    return data;
  },

  byId: async (id: number, signal?: AbortSignal): Promise<DebtDetail> => {
    const { data } = await api.get<DebtDetail>(`/debts/${id}`, { signal });
    return data;
  },

  makePayment: async (id: number, values: DebtPaymentInput): Promise<Debt> => {
    const { data } = await api.post<Debt>(`/debts/${id}/pay`, values);
    return data;
  },
};
