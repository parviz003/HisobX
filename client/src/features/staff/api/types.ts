export type StaffRole = 'MANAGER' | 'ADMIN' | 'SELLER';

export type StaffUser = {
  id: number;
  fullName?: string | null;
  phone: string;
  role: StaffRole;
  isActive: boolean;
  storeId?: number | null;
  createdAt: string;
};

export type StaffInput = {
  fullName: string;
  phone: string;
  password?: string;
  role: StaffRole;
};

export type StaffUpdateInput = {
  fullName?: string;
  phone?: string;
  role?: StaffRole;
  isActive?: boolean;
};
