import { lazy, Suspense } from "react";
import { useRoutes } from "react-router-dom";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { DashboardLayout } from "@contexts/shared/custom";
import { routes } from "@contexts/shared/custom/router";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";

const LoginPage = lazy(() => import("@contexts/iam/ui/pages/LoginPage").then(m => ({ default: m.LoginPage })));

function App() {
  const { isLoading, isAuthenticated } = useAuth();
  const routeElement = useRoutes(routes);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <PageLoader />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><PageLoader /></div>}>
        <LoginPage />
      </Suspense>
    );
  }

  return <DashboardLayout>{routeElement}</DashboardLayout>;
}

export default App;
