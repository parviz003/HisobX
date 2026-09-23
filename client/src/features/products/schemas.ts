import { z } from 'zod';

export const UNITS = ['dona', 'kg', 'litr'] as const;

export const productSchema = z.object({
  name: z.string().trim().min(1, 'validation.required'),
  sellingPrice: z
    .number({ message: 'validation.required' })
    .int()
    .min(1, 'validation.required'),
  unit: z.enum(UNITS),
  barcode: z.string().trim().max(64).optional(),
  categoryId: z.number().int().positive().nullable().optional(),
  minStock: z.number().int().min(0).optional(),
  // Ixtiyoriy boshlang'ich qoldiq (faqat yangi mahsulotda).
  openingQuantity: z.number().int().min(0).optional(),
  openingUnitPrice: z.number().int().min(0).optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const inventoryRowSchema = z.object({
  productId: z.number({ message: 'validation.required' }).int().positive(),
  quantity: z.number({ message: 'validation.required' }).int().min(1),
  unitPrice: z.number().int().min(0).optional(),
  note: z.string().trim().max(255).optional(),
});
export type InventoryRowValues = z.infer<typeof inventoryRowSchema>;
