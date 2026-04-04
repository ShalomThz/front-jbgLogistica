import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { Policy } from "@contexts/shared/domain/policies/Policy";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  policy?: Policy;
  redirectTo?: string;
}

export const ProtectedRoute = ({
  children,
  fallback,
  policy,
  redirectTo = "/",
}: ProtectedRouteProps) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return fallback ?? <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (policy && user && !policy(user)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
