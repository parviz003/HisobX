import { api } from '@/lib/api/client';
import type { CurrentUser } from '@/features/auth/api/types';

export const profileApi = {
  update: async (values: { fullName?: string; phone?: string }): Promise<CurrentUser> => {
    const { data } = await api.patch<CurrentUser>('/users/me', values);
    return data;
  },

  /** Backend UpdateProfileDto'sida parol ham shu endpoint orqali yangilanadi. */
  changePassword: async (password: string): Promise<void> => {
    await api.patch('/users/me', { password });
  },

  /** Rasm `multipart/form-data` da `image` maydoni bilan yuboriladi. */
  uploadImage: async (file: File): Promise<CurrentUser> => {
    const form = new FormData();
    form.append('image', file);
    const { data } = await api.patch<CurrentUser>('/users/me/image', form);
    return data;
  },

  removeImage: async (): Promise<void> => {
    await api.delete('/users/me/image');
  },
};
