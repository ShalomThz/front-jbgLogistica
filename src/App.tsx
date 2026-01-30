import { useRoutes } from "react-router-dom";
import { useAuth, LoginPage } from "@/contexts/users/AuthenticateUser";
import { DashboardLayout } from "@/shared/custom";
import { routes } from "@/shared/custom/router";
import { LoaderOne } from "@/shared/shadcn";

function App() {
  const { isLoading, isAuthenticated } = useAuth();
  const routeElement = useRoutes(routes);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoaderOne />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <DashboardLayout>{routeElement}</DashboardLayout>;
}

export default App;
