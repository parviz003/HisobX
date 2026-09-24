export type Customer = {
  id: number;
  name: string;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  storeId: number;
  totalDebt?: number;
  createdAt: string;
  updatedAt: string;
};

export type CustomerDetail = Customer & {
  debts?: Array<{
    id: number;
    amount: number;
    remainingAmount: number;
    dueDate?: string | null;
    isPaid: boolean;
    note?: string | null;
    createdAt: string;
  }>;
};

export type CustomerInput = {
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
};

export type CustomerQuery = {
  page?: number;
  limit?: number;
  search?: string;
};
