import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from '@/stores/auth';
import type { RoleName } from '@/types';

interface RequireAuthProps {
  allowedRoles?: RoleName[];
}

export function RequireAuth({ allowedRoles }: RequireAuthProps) {
  const { isAuthenticated, user, isInitializing } = useAuthStore();

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role.name)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
