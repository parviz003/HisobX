export type DebtCustomer = {
  id: number;
  name: string;
  phone?: string | null;
};

export type DebtSale = {
  id: number;
  saleNumber: number;
  totalAmount: number;
};

export type DebtPayment = {
  id: number;
  amount: number;
  note?: string | null;
  debtId: number;
  createdAt: string;
};

export type Debt = {
  id: number;
  amount: number;
  remainingAmount: number;
  dueDate?: string | null;
  isPaid: boolean;
  note?: string | null;
  storeId: number;
  saleId: number;
  customerId: number;
  createdAt: string;
  updatedAt: string;
  customer?: DebtCustomer;
  sale?: DebtSale;
};

export type DebtDetail = Debt & {
  debtPayments: DebtPayment[];
};

export type OverdueGroup = {
  customer: DebtCustomer;
  totalOwed: number;
  debts: Debt[];
};

export type DebtQuery = {
  page?: number;
  limit?: number;
  customerId?: number;
  isPaid?: boolean;
};

export type DebtPaymentInput = {
  amount: number;
  note?: string;
};
