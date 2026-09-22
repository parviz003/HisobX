import type { Role } from '@/lib/permissions';

/**
 * TODO(backend): Swagger'da javob (response) sxemalari umuman yo'q —
 * `@ApiResponse({ type: ... })` qo'shilgach, bu tiplar orval generatsiya
 * qilgan tiplar bilan almashtiriladi. Hozircha kontraktdagi tavsifga tayanib
 * minimal shakl e'lon qilingan.
 */
export type CurrentUser = {
  id: number;
  fullName: string;
  phone: string;
  role: Role;
  status: 'ACTIVE' | 'INACTIVE';
  storeId: number | null;
  image?: string | null;
  telegramLinked?: boolean;
};
