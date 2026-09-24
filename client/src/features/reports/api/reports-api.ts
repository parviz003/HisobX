import { api } from '@/lib/api/client';

export type DailyReport = {
  date: string;
  salesCount: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  cashBalance: number;
  totalOutstandingDebt: number;
  lowStockProductsCount: number;
};

export type MonthlyReport = {
  year: number;
  month: number;
  totalSalesCount: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
};

export const reportKeys = {
  all: ['reports'] as const,
  daily: (date?: string) => [...reportKeys.all, 'daily', date ?? 'today'] as const,
  monthly: (year?: number, month?: number) =>
    [...reportKeys.all, 'monthly', year, month] as const,
};

export const reportsApi = {
  daily: async (date?: string, signal?: AbortSignal): Promise<DailyReport> => {
    const { data } = await api.get<DailyReport>('/reports/daily', {
      params: date ? { date } : undefined,
      signal,
    });
    return data;
  },

  monthly: async (year?: number, month?: number, signal?: AbortSignal): Promise<MonthlyReport> => {
    const { data } = await api.get<MonthlyReport>('/reports/monthly', {
      params: { year, month },
      signal,
    });
    return data;
  },
};
