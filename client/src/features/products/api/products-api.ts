import { api } from '@/lib/api/client';
import type { Paginated } from '@/lib/api/pagination';
import type { Product, ProductInput, ProductQuery } from './types';

/** `ProductInput` ni backend kutadigan multipart shakliga o'giradi. */
function toFormData(values: ProductInput, image?: File | null): FormData {
  const form = new FormData();
  form.append('name', values.name);
  form.append('sellingPrice', String(values.sellingPrice));
  if (values.unit) form.append('unit', values.unit);
  if (values.barcode) form.append('barcode', values.barcode);
  if (values.minStock !== undefined) form.append('minStock', String(values.minStock));
  if (values.categoryId) form.append('categoryId', String(values.categoryId));
  if (image) form.append('image', image);
  return form;
}

export const productsApi = {
  list: async (query: ProductQuery, signal?: AbortSignal): Promise<Paginated<Product>> => {
    const { data } = await api.get<Paginated<Product>>('/products', {
      params: query,
      signal,
    });
    return data;
  },

  byId: async (id: number, signal?: AbortSignal): Promise<Product> => {
    const { data } = await api.get<Product>(`/products/${id}`, { signal });
    return data;
  },

  create: async (values: ProductInput, image?: File | null): Promise<Product> => {
    const { data } = await api.post<Product>('/products', toFormData(values, image));
    return data;
  },

  update: async (
    id: number,
    values: Partial<ProductInput>,
    image?: File | null,
  ): Promise<Product> => {
    // Rasm bo'lsa multipart, aks holda oddiy JSON yuboramiz.
    if (image) {
      const form = toFormData(values as ProductInput, image);
      const { data } = await api.patch<Product>(`/products/${id}`, form);
      return data;
    }
    const { data } = await api.patch<Product>(`/products/${id}`, values);
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};
