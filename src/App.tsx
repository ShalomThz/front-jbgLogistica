import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useRoutes } from "react-router-dom";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { CustomerLayout, DashboardLayout } from "@contexts/shared/ui/layouts";
import { routes } from "@contexts/shared/ui/router";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";

const LoginPage = lazy(() => import("@contexts/iam/ui/pages/LoginPage").then(m => ({ default: m.LoginPage })));
const CustomerWarehousePage = lazy(() => import("@/contexts/customer-warehouse/ui/pages/CustomerWarehousePage").then(m => ({ default: m.CustomerWarehousePage })));

function App() {
  const { isLoading, isAuthenticated, isCustomer } = useAuth();
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

  if (isCustomer) {
    return (
      <CustomerLayout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/customer-warehouse" element={<CustomerWarehousePage />} />
            <Route path="*" element={<Navigate to="/customer-warehouse" replace />} />
          </Routes>
        </Suspense>
      </CustomerLayout>
    );
  }

  return <DashboardLayout>{routeElement}</DashboardLayout>;
}

export default App;
