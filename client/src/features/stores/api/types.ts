export interface StoreCounts {
  users: number;
  products: number;
  sales: number;
}

export interface StoreItem {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  telegramChatId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: StoreCounts;
}

export interface StoreListResponse {
  items: StoreItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface OnboardStoreDto {
  store: {
    name: string;
    phone?: string;
    address?: string;
  };
  admin: {
    fullName: string;
    phone: string;
    password: string;
  };
}

export interface OnboardStoreResponse {
  store: StoreItem;
  manager: {
    id: number;
    fullName: string;
    phone: string;
    role: string;
    storeId: number;
  };
}
