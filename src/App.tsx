import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { CustomerLayout, DashboardLayout } from "@contexts/shared/custom";
import { routes } from "@contexts/shared/custom/router";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation, useRoutes, useSearchParams } from "react-router-dom";

const LoginPage = lazy(() => import("@contexts/iam/ui/pages/LoginPage").then(m => ({ default: m.LoginPage })));
const CustomerWarehousePage = lazy(() => import("@/contexts/customer-warehouse/ui/pages/CustomerWarehousePage").then(m => ({ default: m.CustomerWarehousePage })));
const PublicTrackingPage = lazy(() => import("@contexts/shipping/ui/pages/PublicTrackingPage").then(m => ({ default: m.PublicTrackingPage })));

function App() {
  const { isLoading, isAuthenticated, isCustomer } = useAuth();
  const location = useLocation();
  const routeElement = useRoutes(routes);
  const isPublicTrackingRoute = location.pathname.startsWith("/tracking/");

  const [searchParams] = useSearchParams();
  const selectedOrderId = searchParams.get("orderId");
  const { user } = useAuth()

  if (user?.type === "DRIVER" && selectedOrderId) {
    return <DashboardLayout>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><PageLoader /></div>}>
        <Routes>
          <Route path="*" element={<Navigate to={"/stop/driver/"+selectedOrderId} replace />} />
        </Routes>
      </Suspense>
    </DashboardLayout>
  }


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <PageLoader />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (isPublicTrackingRoute) {
      return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><PageLoader /></div>}>
          <Routes>
            <Route path="/tracking/:trackingNumber" element={<PublicTrackingPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      );
    }

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
