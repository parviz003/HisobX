import {
  LayoutDashboard,
  ShoppingCart,
  ReceiptText,
  Package,
  Tags,
  Warehouse,
  Users,
  HandCoins,
  Wallet,
  TrendingDown,
  BarChart3,
  UserCog,
  Settings,
  Bell,
  Smartphone,
  User,
  Store,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '@/lib/permissions';

export type NavItem = {
  icon: LucideIcon;
  /** nav namespace'idagi kalit */
  labelKey: string;
  path: string;
  roles: readonly Role[];
  /** `tab` — pastki panelda, `more` — "Ko'proq" sheet'ida */
  placement: 'tab' | 'more';
  /** POS tugmasi pastki panelda ajratib ko'rsatiladi */
  highlight?: boolean;
};

const ALL_STORE_ROLES = ['MANAGER', 'ADMIN', 'SELLER'] as const;
const MANAGEMENT = ['MANAGER', 'ADMIN'] as const;

/**
 * Pastki panel har rol uchun maksimum 5 elementdan iborat (topshiriq 1.11).
 * Qolgan hamma narsa "Ko'proq" sheet'iga tushadi.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  // --- Tab bar ---
  {
    icon: LayoutDashboard,
    labelKey: 'dashboard',
    path: '/dashboard',
    roles: ALL_STORE_ROLES,
    placement: 'tab',
  },
  {
    icon: ShoppingCart,
    labelKey: 'pos',
    path: '/pos',
    roles: ALL_STORE_ROLES,
    placement: 'tab',
    highlight: true,
  },
  {
    icon: ReceiptText,
    labelKey: 'sales',
    path: '/sales',
    roles: ['SELLER'],
    placement: 'tab',
  },
  {
    icon: Package,
    labelKey: 'products',
    path: '/products',
    roles: MANAGEMENT,
    placement: 'tab',
  },
  {
    icon: HandCoins,
    labelKey: 'debts',
    path: '/debts',
    roles: ALL_STORE_ROLES,
    placement: 'tab',
  },
  {
    icon: Store,
    labelKey: 'stores',
    path: '/stores',
    roles: ['SUPERADMIN'],
    placement: 'tab',
  },

  // --- "Ko'proq" ---
  {
    icon: ReceiptText,
    labelKey: 'sales',
    path: '/sales',
    roles: MANAGEMENT,
    placement: 'more',
  },
  {
    icon: Package,
    labelKey: 'products',
    path: '/products',
    roles: ['SELLER'],
    placement: 'more',
  },
  {
    icon: Tags,
    labelKey: 'categories',
    path: '/categories',
    roles: MANAGEMENT,
    placement: 'more',
  },
  {
    icon: Warehouse,
    labelKey: 'inventory',
    path: '/inventory',
    roles: MANAGEMENT,
    placement: 'more',
  },
  {
    icon: Users,
    labelKey: 'customers',
    path: '/customers',
    roles: ALL_STORE_ROLES,
    placement: 'more',
  },
  {
    icon: Wallet,
    labelKey: 'cash',
    path: '/cash',
    roles: MANAGEMENT,
    placement: 'more',
  },
  {
    icon: TrendingDown,
    labelKey: 'expenses',
    path: '/expenses',
    roles: MANAGEMENT,
    placement: 'more',
  },
  {
    icon: BarChart3,
    labelKey: 'reports',
    path: '/reports',
    roles: MANAGEMENT,
    placement: 'more',
  },
  {
    icon: UserCog,
    labelKey: 'staff',
    path: '/staff',
    roles: MANAGEMENT,
    placement: 'more',
  },
  {
    icon: Settings,
    labelKey: 'settings',
    path: '/settings',
    roles: ['MANAGER'],
    placement: 'more',
  },
  {
    icon: Bell,
    labelKey: 'notifications',
    path: '/notifications',
    roles: ALL_STORE_ROLES,
    placement: 'more',
  },
  {
    icon: User,
    labelKey: 'profile',
    path: '/profile',
    roles: ['SUPERADMIN', ...ALL_STORE_ROLES],
    placement: 'more',
  },
  {
    icon: Smartphone,
    labelKey: 'devices',
    path: '/devices',
    roles: ['SUPERADMIN', ...ALL_STORE_ROLES],
    placement: 'more',
  },
];

export function navItemsFor(role: Role | null, placement: NavItem['placement']): NavItem[] {
  if (!role) return [];
  return NAV_ITEMS.filter((item) => item.placement === placement && item.roles.includes(role));
}

/** Login'dan keyin rolga qarab boshlang'ich sahifa. */
export function homePathFor(role: Role | null): string {
  if (role === 'SUPERADMIN') return '/stores';
  if (role === 'SELLER') return '/pos';
  return '/dashboard';
}
