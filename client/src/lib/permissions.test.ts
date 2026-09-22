import { describe, expect, it } from 'vitest';
import { can, canAny, isReadOnlyMode, ROLES } from './permissions';

describe('ruxsatlar matritsasi', () => {
  it('adminlarni faqat MANAGER boshqaradi', () => {
    expect(can('MANAGER', 'staff.admins.manage')).toBe(true);
    expect(can('ADMIN', 'staff.admins.manage')).toBe(false);
    expect(can('SELLER', 'staff.admins.manage')).toBe(false);
  });

  it('sotuvchilarni MANAGER va ADMIN boshqaradi', () => {
    expect(can('MANAGER', 'staff.sellers.manage')).toBe(true);
    expect(can('ADMIN', 'staff.sellers.manage')).toBe(true);
    expect(can('SELLER', 'staff.sellers.manage')).toBe(false);
  });

  it("do'kon sozlamalari faqat MANAGER'da", () => {
    expect(can('MANAGER', 'store.settings.manage')).toBe(true);
    expect(can('ADMIN', 'store.settings.manage')).toBe(false);
  });

  it('SELLER tannarx, foyda va kassani ko\'rmaydi', () => {
    expect(can('SELLER', 'cost.view')).toBe(false);
    expect(can('SELLER', 'reports.view')).toBe(false);
    expect(can('SELLER', 'cash.view')).toBe(false);
    expect(can('SELLER', 'cash.adjust')).toBe(false);
  });

  it('savdoni bekor qilish SELLER uchun yopiq', () => {
    expect(can('MANAGER', 'sale.cancel')).toBe(true);
    expect(can('ADMIN', 'sale.cancel')).toBe(true);
    expect(can('SELLER', 'sale.cancel')).toBe(false);
  });

  it('savdo, mijoz va qarz to\'lovi uch rolda ham ochiq', () => {
    for (const role of ['MANAGER', 'ADMIN', 'SELLER'] as const) {
      expect(can(role, 'sale.create')).toBe(true);
      expect(can(role, 'customer.manage')).toBe(true);
      expect(can(role, 'debt.collect')).toBe(true);
    }
  });

  it("SELLER mahsulotni faqat ko'radi", () => {
    expect(can('SELLER', 'catalog.view')).toBe(true);
    expect(can('SELLER', 'catalog.manage')).toBe(false);
  });

  it("SUPERADMIN do'kon ichidagi amallarni bajarmaydi", () => {
    expect(can('SUPERADMIN', 'stores.manage')).toBe(true);
    expect(can('SUPERADMIN', 'sale.create')).toBe(false);
    expect(can('SUPERADMIN', 'catalog.manage')).toBe(false);
  });

  it('rol yo\'q bo\'lsa hech narsaga ruxsat yo\'q', () => {
    expect(can(null, 'sale.create')).toBe(false);
    expect(can(undefined, 'catalog.view')).toBe(false);
  });

  it('canAny kamida bitta ruxsat bo\'lsa true qaytaradi', () => {
    expect(canAny('SELLER', ['cost.view', 'sale.create'])).toBe(true);
    expect(canAny('SELLER', ['cost.view', 'cash.view'])).toBe(false);
  });

  it('barcha rollar matritsada mavjud', () => {
    for (const role of ROLES) {
      expect(() => can(role, 'sale.create')).not.toThrow();
    }
  });
});

describe('isReadOnlyMode', () => {
  it("faqat SUPERADMIN do'kon ko'rish rejimida yopiq bo'ladi", () => {
    expect(isReadOnlyMode('SUPERADMIN', true)).toBe(true);
    expect(isReadOnlyMode('SUPERADMIN', false)).toBe(false);
    expect(isReadOnlyMode('MANAGER', true)).toBe(false);
  });
});
