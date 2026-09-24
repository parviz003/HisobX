import { api } from '@/lib/api/client';
import type { Paginated } from '@/lib/api/pagination';
import type { CashBalance, CashQuery, CashTransaction, CashTransactionInput } from './types';

export const cashKeys = {
  all: ['cash'] as const,
  balance: () => [...cashKeys.all, 'balance'] as const,
  transactions: () => [...cashKeys.all, 'transactions'] as const,
  transactionList: (query: CashQuery) => [...cashKeys.transactions(), query] as const,
};

export const cashApi = {
  balance: async (signal?: AbortSignal): Promise<CashBalance> => {
    const { data } = await api.get<CashBalance>('/cash/balance', { signal });
    return data;
  },

  transactions: async (query: CashQuery = {}, signal?: AbortSignal): Promise<Paginated<CashTransaction>> => {
    const { data } = await api.get<Paginated<CashTransaction>>('/cash/transactions', {
      params: query,
      signal,
    });
    return data;
  },

  create: async (values: CashTransactionInput): Promise<CashTransaction> => {
    const { data } = await api.post<CashTransaction>('/cash/transactions', values);
    return data;
  },
};
