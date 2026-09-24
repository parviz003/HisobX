import { api } from '@/lib/api/client';
import type { StoreListResponse, OnboardStoreDto, OnboardStoreResponse } from './types';

export const storesApi = {
  async getStores(params?: { page?: number; limit?: number; search?: string }): Promise<StoreListResponse> {
    const response = await api.get<StoreListResponse>('/stores', { params });
    return response.data;
  },

  async onboardStore(data: OnboardStoreDto): Promise<OnboardStoreResponse> {
    const response = await api.post<OnboardStoreResponse>('/stores/onboard', data);
    return response.data;
  },

  async removeStore(id: number): Promise<{ message: string; id: number }> {
    const response = await api.delete<{ message: string; id: number }>(`/stores/${id}`);
    return response.data;
  },
};
