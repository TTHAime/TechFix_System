import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from '@/stores/auth';
import type { RoleName } from '@/types';

interface RequireAuthProps {
  allowedRoles?: RoleName[];
}

export function RequireAuth({ allowedRoles }: RequireAuthProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role.name)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
