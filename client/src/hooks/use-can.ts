import { can, type Action } from '@/lib/permissions';
import { useAuth } from '@/features/auth/hooks/use-auth';

/** Joriy foydalanuvchi shu amalni bajara oladimi. */
export function useCan(action: Action): boolean {
  const { role, isReadOnly } = useAuth();
  // Ko'rish rejimida (SUPERADMIN) barcha yozish amallari yopiq.
  if (isReadOnly && action !== 'stores.manage' && action !== 'stores.impersonate') {
    return false;
  }
  return can(role, action);
}
