export type ExpenseCategory = {
  id: number;
  name: string;
  storeId: number;
  createdAt: string;
  updatedAt: string;
};

export type Expense = {
  id: number;
  amount: number;
  note?: string | null;
  storeId: number;
  expenseCategoryId: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  expenseCategory?: ExpenseCategory;
  user?: {
    id: number;
    fullName?: string | null;
  };
};

export type ExpenseInput = {
  amount: number;
  expenseCategoryId: number;
  note?: string;
};

export type ExpenseCategoryInput = {
  name: string;
};

export type ExpenseQuery = {
  page?: number;
  limit?: number;
  expenseCategoryId?: number;
  startDate?: string;
  endDate?: string;
};
