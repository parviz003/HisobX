import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/features/auth/hooks/use-auth';
import type { Role } from '@/lib/permissions';

/** Sahifani faqat ruxsat etilgan rollarga ochadi, aks holda 403. */
export function RoleGuard({ roles }: { roles: readonly Role[] }) {
  const { role, isLoading } = useAuth();

  if (isLoading) return null;
  if (!role || !roles.includes(role)) return <Navigate to="/403" replace />;

  return <Outlet />;
}
