export type SaleItem = {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  costPrice?: number | null;
  total: number;
  product?: {
    id: number;
    name: string;
    unit?: string | null;
  };
};

export type Sale = {
  id: number;
  saleNumber: number;
  status: 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  paymentType: 'CASH' | 'CREDIT';
  subtotal: number;
  discountPercent?: number | null;
  discountAmount?: number | null;
  totalAmount: number;
  userId: number;
  customerId?: number | null;
  storeId: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    fullName?: string | null;
    phone?: string | null;
  };
  customer?: {
    id: number;
    name: string;
    phone?: string | null;
  };
  items?: SaleItem[];
};

export type SaleQuery = {
  page?: number;
  limit?: number;
  paymentType?: 'CASH' | 'CREDIT';
  status?: 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  customerId?: number;
  startDate?: string;
  endDate?: string;
};
