import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { isApiError } from '@/lib/api/errors';
import { getImpersonatedStoreId } from '@/lib/api/session';
import type { Role } from '@/lib/permissions';
import { authKeys } from '../api/queryKeys';
import type { CurrentUser } from '../api/types';

async function fetchCurrentUser(signal?: AbortSignal): Promise<CurrentUser> {
  const response = await api.get<CurrentUser>('/users/me', { signal });
  return response.data;
}

/**
 * Joriy foydalanuvchi. Token cookie'da bo'lgani uchun "kirganmi yo'qmi" degan
 * savolga yagona javob — `GET /users/me` ning natijasi.
 */
export function useAuth() {
  const query = useQuery({
    queryKey: authKeys.me(),
    queryFn: ({ signal }) => fetchCurrentUser(signal),
    retry: (failureCount, error) => {
      // Kirmagan foydalanuvchini qayta-qayta so'ramaymiz.
      if (isApiError(error) && [401, 403, 404, 429].includes(error.status)) return false;
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000,
  });

  const user = query.data ?? null;
  const role: Role | null = user?.role ?? null;
  const impersonatedStoreId = getImpersonatedStoreId();

  return {
    user,
    role,
    isAuthenticated: Boolean(user),
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    /** SUPERADMIN boshqa do'konni ko'rayotgan bo'lsa — yozish amallari yopiq. */
    isReadOnly: role === 'SUPERADMIN' && impersonatedStoreId !== null,
    impersonatedStoreId,
    refetch: query.refetch,
  };
}
