import type { ReactNode } from 'react';
import { useAuth } from '../../infrastructure/hooks';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  roles?: Array<"ADMIN" | "HQ" | "PARTNER">;
}

export const ProtectedRoute = ({
  children,
  fallback,
  roles,
}: ProtectedRouteProps) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return fallback ?? <div>No autorizado</div>;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <div>Sin permisos para esta sección</div>;
  }

  return <>{children}</>;
};
