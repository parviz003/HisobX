/**
 * Ruxsatlar matritsasi — topshiriqning 1-bo'limidagi jadvalning YAGONA manbai.
 * UI shu yerga tayanadi; asosiy himoya baribir backend'da.
 *
 * TODO(backend): `MANAGER` roli backend'da hali yo'q (Swagger'da role enum =
 * ADMIN | SELLER). Kontrakt yangilangach, orval tiplari bilan solishtirib chiqiladi.
 */
export const ROLES = ['SUPERADMIN', 'MANAGER', 'ADMIN', 'SELLER'] as const;
export type Role = (typeof ROLES)[number];

export const ACTIONS = [
  // Xodimlar
  'staff.admins.manage',
  'staff.sellers.manage',
  'staff.view',
  // Do'kon
  'store.settings.manage',
  'store.reminders.manage',
  // Katalog va ombor
  'catalog.manage',
  'catalog.view',
  'inventory.manage',
  // Moliya
  'cost.view',
  'reports.view',
  'cash.view',
  'cash.adjust',
  'expenses.manage',
  // Savdo
  'sale.create',
  'sale.cancel',
  'sale.viewAll',
  'customer.manage',
  'debt.collect',
  // SUPERADMIN
  'stores.manage',
  'stores.impersonate',
] as const;
export type Action = (typeof ACTIONS)[number];

const MATRIX: Record<Role, ReadonlySet<Action>> = {
  SUPERADMIN: new Set<Action>(['stores.manage', 'stores.impersonate']),

  MANAGER: new Set<Action>([
    'staff.admins.manage',
    'staff.sellers.manage',
    'staff.view',
    'store.settings.manage',
    'store.reminders.manage',
    'catalog.manage',
    'catalog.view',
    'inventory.manage',
    'cost.view',
    'reports.view',
    'cash.view',
    'cash.adjust',
    'expenses.manage',
    'sale.create',
    'sale.cancel',
    'sale.viewAll',
    'customer.manage',
    'debt.collect',
  ]),

  // ADMIN: adminlarni boshqarish va do'kon sozlamalaridan tashqari hammasi.
  ADMIN: new Set<Action>([
    'staff.sellers.manage',
    'staff.view',
    'catalog.manage',
    'catalog.view',
    'inventory.manage',
    'cost.view',
    'reports.view',
    'cash.view',
    'cash.adjust',
    'expenses.manage',
    'sale.create',
    'sale.cancel',
    'sale.viewAll',
    'customer.manage',
    'debt.collect',
  ]),

  // SELLER: savdo qiladi, mahsulotni tannarxsiz ko'radi.
  SELLER: new Set<Action>([
    'catalog.view',
    'sale.create',
    'customer.manage',
    'debt.collect',
  ]),
};

export function can(role: Role | null | undefined, action: Action): boolean {
  if (!role) return false;
  return MATRIX[role]?.has(action) ?? false;
}

/** Bir nechta amaldan kamida bittasiga ruxsat bormi. */
export function canAny(role: Role | null | undefined, actions: readonly Action[]): boolean {
  return actions.some((a) => can(role, a));
}

/** SUPERADMIN do'konni faqat ko'rish rejimida ochadi — yozish amallari yopiladi. */
export function isReadOnlyMode(role: Role | null | undefined, impersonating: boolean): boolean {
  return role === 'SUPERADMIN' && impersonating;
}
