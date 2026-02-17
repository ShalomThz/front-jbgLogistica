import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { Permission } from "@contexts/iam/domain/schemas/userRole/UserRole";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  roles?: string[];
  permissions?: Permission[];
  redirectTo?: string;
}

export const ProtectedRoute = ({
  children,
  fallback,
  roles,
  permissions,
  redirectTo = "/",
}: ProtectedRouteProps) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return fallback ?? <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role.name)) {
    return <Navigate to={redirectTo} replace />;
  }

  if (
    permissions &&
    user &&
    !permissions.some((p) => user.role.permissions.includes(p))
  ) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
