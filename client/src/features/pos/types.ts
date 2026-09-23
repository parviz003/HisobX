import type { Product } from '@/features/products/api/types';

export type CartItem = {
  product: Product;
  quantity: number;
};

export type CompletedSale = {
  id: number;
  saleNumber: number;
  subtotal: number;
  discountPercent?: number | null;
  discountAmount?: number | null;
  totalAmount: number;
  paymentType: 'CASH' | 'CREDIT';
  customerName?: string | null;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  createdAt: string;
};
