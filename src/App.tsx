import { useRoutes } from "react-router-dom";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { LoginPage } from "@contexts/iam/ui/pages/LoginPage";
import { DashboardLayout } from "@contexts/shared/custom";
import { routes } from "@contexts/shared/custom/router";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";

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
    return <LoginPage />;
  }

  return <DashboardLayout>{routeElement}</DashboardLayout>;
}

export default App;
