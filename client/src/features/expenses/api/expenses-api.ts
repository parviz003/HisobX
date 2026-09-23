import { api } from '@/lib/api/client';
import type { Paginated } from '@/lib/api/pagination';
import type {
  Expense,
  ExpenseCategory,
  ExpenseCategoryInput,
  ExpenseInput,
  ExpenseQuery,
} from './types';

export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (query: ExpenseQuery) => [...expenseKeys.lists(), query] as const,
  categories: () => [...expenseKeys.all, 'categories'] as const,
};

export const expensesApi = {
  list: async (query: ExpenseQuery = {}, signal?: AbortSignal): Promise<Paginated<Expense>> => {
    const { data } = await api.get<Paginated<Expense>>('/expenses', {
      params: query,
      signal,
    });
    return data;
  },

  create: async (values: ExpenseInput): Promise<Expense> => {
    const { data } = await api.post<Expense>('/expenses', values);
    return data;
  },

  listCategories: async (signal?: AbortSignal): Promise<ExpenseCategory[]> => {
    const { data } = await api.get<ExpenseCategory[]>('/expenses/categories', { signal });
    return data;
  },

  createCategory: async (values: ExpenseCategoryInput): Promise<ExpenseCategory> => {
    const { data } = await api.post<ExpenseCategory>('/expenses/categories', values);
    return data;
  },

  updateCategory: async (id: number, values: ExpenseCategoryInput): Promise<ExpenseCategory> => {
    const { data } = await api.patch<ExpenseCategory>(`/expenses/categories/${id}`, values);
    return data;
  },

  removeCategory: async (id: number): Promise<void> => {
    await api.delete(`/expenses/categories/${id}`);
  },
};
