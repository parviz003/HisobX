import { describe, expect, it } from 'vitest';
import { homePathFor, navItemsFor, NAV_ITEMS } from './navigation';
import { ROLES, type Role } from '@/lib/permissions';

function pathsFor(role: Role): string[] {
  return [...navItemsFor(role, 'tab'), ...navItemsFor(role, 'more')].map((i) => i.path);
}

describe('navigatsiya rol bo\'yicha', () => {
  it('pastki panel hech qachon 4 tadan oshmaydi (+ "Ko\'proq" = 5)', () => {
    for (const role of ROLES) {
      expect(navItemsFor(role, 'tab').length).toBeLessThanOrEqual(4);
    }
  });

  it("SELLER'da savdolar tab'da, mahsulotlar \"Ko'proq\"da", () => {
    expect(navItemsFor('SELLER', 'tab').map((i) => i.path)).toContain('/sales');
    expect(navItemsFor('SELLER', 'more').map((i) => i.path)).toContain('/products');
  });

  it("MANAGER/ADMIN'da mahsulotlar tab'da", () => {
    expect(navItemsFor('MANAGER', 'tab').map((i) => i.path)).toContain('/products');
    expect(navItemsFor('ADMIN', 'tab').map((i) => i.path)).toContain('/products');
  });

  it('SELLER kassa, xarajat, hisobot va xodimlarni ko\'rmaydi', () => {
    const paths = pathsFor('SELLER');
    for (const hidden of ['/cash', '/expenses', '/reports', '/staff', '/inventory']) {
      expect(paths).not.toContain(hidden);
    }
  });

  it("do'kon sozlamalari faqat MANAGER menyusida", () => {
    expect(pathsFor('MANAGER')).toContain('/settings');
    expect(pathsFor('ADMIN')).not.toContain('/settings');
    expect(pathsFor('SELLER')).not.toContain('/settings');
  });

  it("SUPERADMIN faqat do'konlar, profil va qurilmalarni ko'radi", () => {
    expect(pathsFor('SUPERADMIN').sort()).toEqual(['/devices', '/profile', '/stores']);
  });

  it("SUPERADMIN do'kon ichidagi bo'limlarni ko'rmaydi", () => {
    const paths = pathsFor('SUPERADMIN');
    for (const hidden of ['/pos', '/products', '/cash', '/debts', '/dashboard']) {
      expect(paths).not.toContain(hidden);
    }
  });

  it('savdo tugmasi ajratib ko\'rsatiladi', () => {
    const pos = NAV_ITEMS.find((i) => i.path === '/pos' && i.placement === 'tab');
    expect(pos?.highlight).toBe(true);
  });

  it('bitta rolda bir yo\'l ikki marta chiqmaydi', () => {
    for (const role of ROLES) {
      const paths = pathsFor(role);
      expect(new Set(paths).size).toBe(paths.length);
    }
  });
});

describe('homePathFor', () => {
  it('rolga mos boshlang\'ich sahifani beradi', () => {
    expect(homePathFor('SUPERADMIN')).toBe('/stores');
    expect(homePathFor('SELLER')).toBe('/pos');
    expect(homePathFor('MANAGER')).toBe('/dashboard');
    expect(homePathFor('ADMIN')).toBe('/dashboard');
  });
});
