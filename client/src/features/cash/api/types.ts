export type CashTransactionType =
  | 'SALE'
  | 'DEBT_PAYMENT'
  | 'EXPENSE'
  | 'OPENING'
  | 'ADJUSTMENT';

export type CashBalance = {
  balance: number;
  lastUpdated?: string | null;
};

export type CashTransaction = {
  id: number;
  type: CashTransactionType;
  amount: number;
  balance: number;
  note?: string | null;
  storeId: number;
  userId: number;
  saleId?: number | null;
  createdAt: string;
  user?: {
    id: number;
    fullName?: string | null;
    phone?: string | null;
  };
  sale?: {
    id: number;
    saleNumber: number;
    totalAmount: number;
  } | null;
};

export type CashTransactionInput = {
  type: 'OPENING' | 'ADJUSTMENT';
  amount: number;
  note?: string;
};

export type CashQuery = {
  page?: number;
  limit?: number;
  type?: CashTransactionType;
};
