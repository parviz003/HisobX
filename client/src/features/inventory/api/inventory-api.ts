import { api } from '@/lib/api/client';
import type { Paginated } from '@/lib/api/pagination';
import type {
  InventoryInput,
  InventoryResult,
  InventoryTransaction,
  InventoryType,
  StockRow,
} from '@/features/products/api/types';

/**
 * TODO(backend): `/inventory/transactions` da sana oralig'i (`startDate`/`endDate`)
 * filtri YO'Q (topshiriq C-9 talab qiladi). Backend `forbidNonWhitelisted` bilan
 * ishlagani uchun noma'lum parametr 400 beradi — shuning uchun yuborilmaydi.
 */
export type TransactionQuery = {
  page?: number;
  limit?: number;
  type?: InventoryType;
  productId?: number;
};

/** TODO(backend): `/inventory/stock` da "kam qolgan" filtri yo'q — ro'yxat klientda saralanadi. */
export type StockQuery = { page?: number; limit?: number };

export const inventoryApi = {
  stock: async (query: StockQuery = {}, signal?: AbortSignal): Promise<Paginated<StockRow>> => {
    const { data } = await api.get<Paginated<StockRow>>('/inventory/stock', {
      params: query,
      signal,
    });
    return data;
  },

  transactions: async (
    query: TransactionQuery,
    signal?: AbortSignal,
  ): Promise<Paginated<InventoryTransaction>> => {
    const { data } = await api.get<Paginated<InventoryTransaction>>(
      '/inventory/transactions',
      { params: query, signal },
    );
    return data;
  },

  /** Boshlang'ich qoldiq — yangi mahsulot yaratilgandan keyin bir marta. */
  opening: async (input: InventoryInput): Promise<InventoryResult> => {
    const { data } = await api.post<InventoryResult>('/inventory/opening', input);
    return data;
  },

  purchase: async (input: InventoryInput): Promise<InventoryResult> => {
    const { data } = await api.post<InventoryResult>('/inventory/purchase', input);
    return data;
  },

  writeOff: async (input: InventoryInput): Promise<InventoryResult> => {
    const { data } = await api.post<InventoryResult>('/inventory/write-off', input);
    return data;
  },
};
