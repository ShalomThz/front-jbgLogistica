import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@contexts/shared/custom/components";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";

// Dashboard (static — initial page)
import { DashboardPage } from "@contexts/shared/custom/pages";

// Sales
const OrdersPage = lazy(() => import("@contexts/order-flow/ui/pages/OrdersPage").then(m => ({ default: m.OrdersPage })));
const NewHQOrderPage = lazy(() => import("@contexts/order-flow/ui/pages/NewHQOrderPage").then(m => ({ default: m.NewHQOrderPage })));
const NewPartnerOrderPage = lazy(() => import("@contexts/order-flow/ui/pages/NewPartnerOrderPage").then(m => ({ default: m.NewPartnerOrderPage })));
const EditOrderPage = lazy(() => import("@contexts/order-flow/ui/pages/EditOrderPage").then(m => ({ default: m.EditOrderPage })));
const CustomersPage = lazy(() => import("@contexts/sales/ui/pages/CustomersPage").then(m => ({ default: m.CustomersPage })));
const WarehousePage = lazy(() => import("@/contexts/warehouse/ui/pages/WarehousePage").then(m => ({ default: m.WarehousePage })));

// Inventory
const BoxPage = lazy(() => import("@contexts/inventory/ui/pages/BoxPage").then(m => ({ default: m.BoxPage })));

// Shipping
const DeliveryRoutesPage = lazy(() => import("@contexts/shipping/ui/pages/DeliveryRoutesPage").then(m => ({ default: m.DeliveryRoutesPage })));
const DriversPage = lazy(() => import("@contexts/shipping/ui/pages/DriversPage").then(m => ({ default: m.DriversPage })));

// Pricing
const TariffsPage = lazy(() => import("@contexts/pricing/ui/pages/TariffsPage").then(m => ({ default: m.TariffsPage })));
const ZonesPage = lazy(() => import("@contexts/pricing/ui/pages/ZonesPage").then(m => ({ default: m.ZonesPage })));

// IAM
const UsersPage = lazy(() => import("@contexts/iam/ui/pages/UsersPage").then(m => ({ default: m.UsersPage })));
const StoresPage = lazy(() => import("@contexts/iam/ui/pages/StoresPage").then(m => ({ default: m.StoresPage })));

export const routes: RouteObject[] = [
  // Dashboard - acceso general para usuarios autenticados
  { path: "/", element: <DashboardPage /> },

  // Ventas
  {
    path: "/customers",
    element: (
      <ProtectedRoute permissions={["CAN_MANAGE_CUSTOMERS"]}>
        <Suspense fallback={<PageLoader />}>
          <CustomersPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/orders",
    element: (
      <ProtectedRoute permissions={["CAN_SELL"]}>
        <Suspense fallback={<PageLoader />}>
          <OrdersPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/orders/new/hq",
    element: (
      <ProtectedRoute permissions={["CAN_SELL"]}>
        <Suspense fallback={<PageLoader />}>
          <NewHQOrderPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/orders/new/partner",
    element: (
      <ProtectedRoute permissions={["CAN_SELL"]}>
        <Suspense fallback={<PageLoader />}>
          <NewPartnerOrderPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/orders/:id/edit",
    element: (
      <ProtectedRoute permissions={["CAN_SELL"]}>
        <Suspense fallback={<PageLoader />}>
          <EditOrderPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/warehouse",
    element: (
      <ProtectedRoute permissions={["CAN_MANAGE_INVENTORY"]}>
        <Suspense fallback={<PageLoader />}>
          <WarehousePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  // Inventario
  {
    path: "/boxes",
    element: (
      <ProtectedRoute permissions={["CAN_MANAGE_INVENTORY"]}>
        <Suspense fallback={<PageLoader />}>
          <BoxPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  // Logística
  {
    path: "/delivery-routes",
    element: (
      <ProtectedRoute permissions={["CAN_SELL"]}>
        <Suspense fallback={<PageLoader />}>
          <DeliveryRoutesPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/drivers",
    element: (
      <ProtectedRoute permissions={["CAN_SELL"]}>
        <Suspense fallback={<PageLoader />}>
          <DriversPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  // Operaciones
  {
    path: "/tariffs",
    element: (
      <ProtectedRoute permissions={["CAN_MANAGE_TARIFFS"]}>
        <Suspense fallback={<PageLoader />}>
          <TariffsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/stores",
    element: (
      <ProtectedRoute permissions={["CAN_MANAGE_STORES"]}>
        <Suspense fallback={<PageLoader />}>
          <StoresPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/zones",
    element: (
      <ProtectedRoute permissions={["CAN_MANAGE_ZONES"]}>
        <Suspense fallback={<PageLoader />}>
          <ZonesPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  // Administración
  {
    path: "/users",
    element: (
      <ProtectedRoute permissions={["CAN_MANAGE_USERS"]}>
        <Suspense fallback={<PageLoader />}>
          <UsersPage />
        </Suspense>
      </ProtectedRoute>
    ),
  }
];
