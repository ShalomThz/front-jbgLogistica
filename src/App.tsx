import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { useWebSocketEvents } from "@contexts/shared/infrastructure/websocket/useWebSocketEvents";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import { CustomerLayout, DashboardLayout } from "@contexts/shared/ui/layouts";
import { routes } from "@contexts/shared/ui/router";
import { Button } from "@contexts/shared/shadcn/components";
import { LogOut } from "lucide-react";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation, useRoutes } from "react-router-dom";

const LoginPage = lazy(() => import("@contexts/iam/ui/pages/LoginPage").then(m => ({ default: m.LoginPage })));
const CustomerWarehousePage = lazy(() => import("@/contexts/customer-warehouse/ui/pages/CustomerWarehousePage").then(m => ({ default: m.CustomerWarehousePage })));
const PublicTrackingPage = lazy(() => import("@contexts/shipping/ui/pages/PublicTrackingPage").then(m => ({ default: m.PublicTrackingPage })));

function App() {
  const { isLoading, isAuthenticated, isCustomer } = useAuth();
  useWebSocketEvents(isAuthenticated);
  const location = useLocation();
  const routeElement = useRoutes(routes);
  const isPublicTrackingRoute = location.pathname.startsWith("/tracking/");

  const { user, logout } = useAuth()

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

  if (user?.type === "DRIVER") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2 bg-background p-4 text-center">
        <p className="text-lg font-semibold">Cuenta de conductor</p>
        <p className="text-muted-foreground">
          Las rutas de entrega se gestionan desde la aplicación JBG Drivers.
        </p>
        <Button variant="outline" onClick={() => logout()}>
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
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
