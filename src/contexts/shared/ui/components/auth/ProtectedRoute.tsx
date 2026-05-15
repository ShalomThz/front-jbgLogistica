import { useEffect, useRef, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import {
  missingPermissions,
  type Policy,
} from "@contexts/shared/domain/policies/Policy";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { humanizePermissions } from "@contexts/iam/ui/utils/humanizePermissions";
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

  const denied = !!(policy && user && !policy(user));

  // Toast lives in an effect so it fires once per denial, not on every render.
  const toastedRef = useRef(false);
  useEffect(() => {
    if (!denied || !policy || !user || toastedRef.current) return;
    toastedRef.current = true;

    const missing = missingPermissions(policy, user);
    if (missing.length === 0) {
      toast.error("Permisos insuficientes para acceder a esta sección.");
      return;
    }

    const labels = humanizePermissions(missing);
    const message =
      policy.mode === "any"
        ? `Permisos insuficientes. Necesitas alguno de: ${labels}`
        : `Permisos insuficientes. Falta: ${labels}`;

    toast.error(message);
  }, [denied, policy, user]);

  if (isLoading) {
    return fallback ?? <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (denied) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
