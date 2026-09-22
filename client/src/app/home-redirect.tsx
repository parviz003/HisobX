import { Navigate } from 'react-router';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { homePathFor } from './navigation';

/** `/` ga kirilganda rolga mos boshlang'ich sahifaga yuboradi. */
export function HomeRedirect() {
  const { role } = useAuth();
  return <Navigate to={homePathFor(role)} replace />;
}
