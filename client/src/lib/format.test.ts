import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatPercent,
  formatPhone,
  formatQuantity,
  parseQuantity,
  toApiPhone,
} from './format';

const NBSP = ' ';

describe('formatMoney', () => {
  it('nolni ham so\'m bilan ko\'rsatadi', () => {
    expect(formatMoney(0)).toBe(`0${NBSP}so'm`);
  });

  it('mingliklarni ajratadi', () => {
    expect(formatMoney(1250000)).toBe(`1${NBSP}250${NBSP}000${NBSP}so'm`);
  });

  it('manfiy summani minus bilan ko\'rsatadi', () => {
    expect(formatMoney(-45000)).toBe(`−45${NBSP}000${NBSP}so'm`);
  });

  it('katta sonni to\'g\'ri ajratadi', () => {
    expect(formatMoney(9876543210)).toBe(`9${NBSP}876${NBSP}543${NBSP}210${NBSP}so'm`);
  });

  it('kasr summani yaxlitlaydi', () => {
    expect(formatMoney(1500.6)).toBe(`1${NBSP}501${NBSP}so'm`);
  });

  it('null va aniqlanmagan qiymatda nol qaytaradi', () => {
    expect(formatMoney(null)).toBe(`0${NBSP}so'm`);
    expect(formatMoney(undefined)).toBe(`0${NBSP}so'm`);
  });

  it('suffiksni o\'chirish va ishora qo\'shish mumkin', () => {
    expect(formatMoney(5000, { withSuffix: false })).toBe(`5${NBSP}000`);
    expect(formatMoney(5000, { sign: true, withSuffix: false })).toBe(`+5${NBSP}000`);
  });
});

describe('formatQuantity', () => {
  it('dona uchun butun son qaytaradi', () => {
    expect(formatQuantity(12, 'dona')).toBe(`12${NBSP}dona`);
    expect(formatQuantity(12.7, 'dona')).toBe(`13${NBSP}dona`);
  });

  it('kg uchun kasrni vergul bilan ko\'rsatadi', () => {
    expect(formatQuantity(1.25, 'kg')).toBe(`1,25${NBSP}kg`);
  });

  it('ortiqcha nollarni kesadi', () => {
    expect(formatQuantity(2, 'litr')).toBe(`2${NBSP}litr`);
    expect(formatQuantity(0.5, 'kg')).toBe(`0,5${NBSP}kg`);
  });

  it('birliksiz ham qaytara oladi', () => {
    expect(formatQuantity(3.5, 'kg', { withUnit: false })).toBe('3,5');
  });
});

describe('parseQuantity', () => {
  it('vergul va nuqtani birdek qabul qiladi', () => {
    expect(parseQuantity('1,25', 'kg')).toBe(1.25);
    expect(parseQuantity('1.25', 'kg')).toBe(1.25);
  });

  it('dona uchun kasrni rad etadi', () => {
    expect(parseQuantity('1.5', 'dona')).toBeNull();
    expect(parseQuantity('3', 'dona')).toBe(3);
  });

  it('bo\'sh va manfiy qiymatni rad etadi', () => {
    expect(parseQuantity('', 'kg')).toBeNull();
    expect(parseQuantity('-2', 'kg')).toBeNull();
  });

  it('3 xonagacha yaxlitlaydi', () => {
    expect(parseQuantity('1,23456', 'kg')).toBe(1.235);
  });
});

describe('formatDate va formatDateTime', () => {
  it('DD.MM.YYYY formatida qaytaradi', () => {
    expect(formatDate('2026-03-09T14:05:00.000Z')).toBe('09.03.2026');
  });

  it('sana va vaqtni birga qaytaradi', () => {
    expect(formatDateTime(new Date(2026, 2, 9, 14, 5))).toBe('09.03.2026 14:05');
  });

  it('bo\'sh qiymatda chiziqcha qaytaradi', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDateTime(undefined)).toBe('—');
  });

  it('noto\'g\'ri sanada chiziqcha qaytaradi', () => {
    expect(formatDate('umuman-sana-emas')).toBe('—');
  });
});

describe('formatPhone va toApiPhone', () => {
  it('o\'qishga qulay ko\'rinishga keltiradi', () => {
    expect(formatPhone('+998901234567')).toBe('+998 90 123 45 67');
  });

  it('kodsiz raqamni ham formatlaydi', () => {
    expect(formatPhone('901234567')).toBe('+998 90 123 45 67');
  });

  it('noto\'g\'ri uzunlikda asl qiymatni qaytaradi', () => {
    expect(formatPhone('12345')).toBe('12345');
  });

  it('backend formatiga o\'giradi', () => {
    expect(toApiPhone('+998 90 123 45 67')).toBe('+998901234567');
    expect(toApiPhone('901234567')).toBe('+998901234567');
  });
});

describe('formatPercent', () => {
  it('musbat foizni ishora bilan ko\'rsatadi', () => {
    expect(formatPercent(12.5)).toBe('+12,5%');
  });

  it('manfiy foizni minus bilan ko\'rsatadi', () => {
    expect(formatPercent(-3)).toBe('−3%');
  });

  it('bo\'sh qiymatda chiziqcha qaytaradi', () => {
    expect(formatPercent(null)).toBe('—');
  });
});
