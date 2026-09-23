import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/features/auth/hooks/use-auth';
import type { Role } from '@/lib/permissions';

/** Sahifani faqat ruxsat etilgan rollarga ochadi, aks holda 403. */
export function RoleGuard({ roles }: { roles: readonly Role[] }) {
  const { role, isLoading, impersonatedStoreId } = useAuth();

  if (isLoading) return null;
  // SUPERADMIN do'konni ko'rish rejimida bo'lsa, do'kon sahifalarini ochishga ruxsat beriladi
  const isSuperadminViewing = role === 'SUPERADMIN' && Boolean(impersonatedStoreId);
  if (!role || (!roles.includes(role) && !isSuperadminViewing)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}

