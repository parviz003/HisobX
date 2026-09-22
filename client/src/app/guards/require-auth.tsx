import { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { onSessionEvent } from '@/lib/api/session';
import { FullPageSpinner } from '@/app/pages/full-page-spinner';

/** Kirmagan foydalanuvchini `/login?redirect=...` ga yuboradi. */
export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Sessiya tugasa (401 → refresh ham muvaffaqiyatsiz) yoki boshqa tab'da
  // chiqilsa — shu tab ham login'ga o'tadi.
  useEffect(
    () =>
      onSessionEvent(() => {
        queryClient.clear();
        const redirect = encodeURIComponent(location.pathname + location.search);
        void navigate(`/login?redirect=${redirect}`, { replace: true });
      }),
    [navigate, queryClient, location.pathname, location.search],
  );

  if (isLoading) return <FullPageSpinner />;

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <Outlet />;
}
