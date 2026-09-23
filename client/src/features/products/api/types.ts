import type {
  CategoryResponseDto,
  CreateInventoryDto,
  InventoryTransactionResponseDto,
  ProductCategoryDto,
  ProductDetailResponseDto,
  ProductListItemDto,
  StockLevelResponseDto,
} from '@/lib/api/generated/model';
import type { Unit } from '@/lib/format';

/**
 * Domen tiplari orval generatsiyasidan olinadi (`docs/swagger.json` — yagona manba).
 * Bu yerda faqat ikki narsa qo'shiladi:
 *  - `unit` Swagger'da `string`, bizda esa aniq ro'yxat (`dona | kg | litr`);
 *  - qulay nomlar (`Product`, `Category`, ...).
 *
 * Pul va miqdor maydonlari `number` — backend kontrakt bo'yicha shunday qaytaradi.
 */
type WithUnit<T extends { unit: string }> = Omit<T, 'unit'> & { unit: Unit };

export type Category = CategoryResponseDto;
export type ProductCategoryRef = ProductCategoryDto;

export type Product = WithUnit<ProductListItemDto>;
export type ProductDetail = WithUnit<ProductDetailResponseDto>;

/** `/inventory/stock` — mahsulotning qisqartirilgan ko'rinishi. */
export type StockRow = StockLevelResponseDto;

export const INVENTORY_TYPES = [
  'PURCHASE',
  'SALE',
  'WRITE_OFF',
  'OPENING',
  'ADJUSTMENT',
] as const;
export type InventoryType = (typeof INVENTORY_TYPES)[number];

export type InventoryTransaction = Omit<InventoryTransactionResponseDto, 'product'> & {
  product?: WithUnit<{ id: number; name: string; barcode: string | null; unit: string }> | null;
};

/** Ombor amallarining javobi. */
export type InventoryResult = {
  product: Product;
  transaction: InventoryTransaction;
};

export type ProductQuery = {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  isActive?: boolean;
};

/**
 * `CreateProductDto` — Swagger'da e'lon qilingan maydonlar.
 * TODO(backend): `isActive` DTO'da YO'Q, shuning uchun mahsulotni
 * faol/nofaol qilib bo'lmaydi (topshiriq 3.3).
 */
export type ProductInput = {
  name: string;
  sellingPrice: number;
  categoryId?: number | null;
  unit?: Unit;
  barcode?: string | null;
  minStock?: number;
};

/** `CreateInventoryDto` — kirim, chiqim va boshlang'ich qoldiq uchun. */
export type InventoryInput = CreateInventoryDto;
