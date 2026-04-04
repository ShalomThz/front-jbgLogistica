import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@contexts/shared/ui/components";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import { orderPolicies } from "@contexts/shared/domain/policies/order.policy";
import { customerPolicies } from "@contexts/shared/domain/policies/customer.policy";
import { boxPolicies } from "@contexts/shared/domain/policies/box.policy";
import { iamPolicies } from "@contexts/shared/domain/policies/iam.policy";
import { warehousePolicies } from "@contexts/shared/domain/policies/warehouse.policy";
import { shippingPolicies } from "@contexts/shared/domain/policies/shipping.policy";
import { pricingPolicies } from "@contexts/shared/domain/policies/pricing.policy";
import { settingsPolicies } from "@contexts/shared/domain/policies/settings.policy";

// Dashboard (static — initial page)
import { DashboardPage } from "@contexts/shared/ui/pages";

// Sales
const OrdersPage = lazy(() => import("@contexts/order-flow/ui/pages/OrdersPage").then(m => ({ default: m.OrdersPage })));
const NewHQOrderPage = lazy(() => import("@contexts/order-flow/ui/pages/NewHQOrderPage").then(m => ({ default: m.NewHQOrderPage })));
const NewPartnerOrderPage = lazy(() => import("@contexts/order-flow/ui/pages/NewPartnerOrderPage").then(m => ({ default: m.NewPartnerOrderPage })));
const EditOrderPage = lazy(() => import("@contexts/order-flow/ui/pages/EditOrderPage").then(m => ({ default: m.EditOrderPage })));
const CustomersPage = lazy(() => import("@contexts/sales/ui/pages/CustomersPage").then(m => ({ default: m.CustomersPage })));
const WarehousePage = lazy(() => import("@/contexts/warehouse/ui/pages/WarehousePage").then(m => ({ default: m.WarehousePage })));

// Inventory
const BoxPage = lazy(() => import("@contexts/inventory/ui/pages/BoxPage").then(m => ({ default: m.BoxPage })));
const BoxSalePage = lazy(() => import("@contexts/inventory/ui/pages/BoxSalePage").then(m => ({ default: m.BoxSalePage })));

// Shipping
const DeliveryRoutesPage = lazy(() => import("@contexts/shipping/ui/pages/DeliveryRoutesPage").then(m => ({ default: m.DeliveryRoutesPage })));
const DriversPage = lazy(() => import("@contexts/shipping/ui/pages/DriversPage").then(m => ({ default: m.DriversPage })));

// Pricing
const TariffsPage = lazy(() => import("@contexts/pricing/ui/pages/TariffsPage").then(m => ({ default: m.TariffsPage })));
const ZonesPage = lazy(() => import("@contexts/pricing/ui/pages/ZonesPage").then(m => ({ default: m.ZonesPage })));

// IAM
const UsersPage = lazy(() => import("@contexts/iam/ui/pages/UsersPage").then(m => ({ default: m.UsersPage })));
const StoresPage = lazy(() => import("@contexts/iam/ui/pages/StoresPage").then(m => ({ default: m.StoresPage })));

// Settings
const SettingsPage = lazy(() => import("@contexts/settings/ui/pages/SettingsPage").then(m => ({ default: m.SettingsPage })));

export const routes: RouteObject[] = [
  // Dashboard - acceso general para usuarios autenticados
  { path: "/", element: <DashboardPage /> },

  // Ventas
  {
    path: "/customers",
    element: (
      <ProtectedRoute policy={customerPolicies.manage}>
        <Suspense fallback={<PageLoader />}>
          <CustomersPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/orders",
    element: (
      <ProtectedRoute policy={orderPolicies.list}>
        <Suspense fallback={<PageLoader />}>
          <OrdersPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/orders/new/hq",
    element: (
      <ProtectedRoute policy={orderPolicies.createHQ}>
        <Suspense fallback={<PageLoader />}>
          <NewHQOrderPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/orders/new/partner",
    element: (
      <ProtectedRoute policy={orderPolicies.createPartner}>
        <Suspense fallback={<PageLoader />}>
          <NewPartnerOrderPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/orders/:id/edit",
    element: (
      <ProtectedRoute policy={orderPolicies.edit}>
        <Suspense fallback={<PageLoader />}>
          <EditOrderPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/warehouse",
    element: (
      <ProtectedRoute policy={warehousePolicies.manage}>
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
      <ProtectedRoute policy={boxPolicies.manage}>
        <Suspense fallback={<PageLoader />}>
          <BoxPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  {
    path: "/box-sales",
    element: (
      <ProtectedRoute policy={boxPolicies.sell}>
        <Suspense fallback={<PageLoader />}>
          <BoxSalePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  // Logística
  {
    path: "/delivery-routes",
    element: (
      <ProtectedRoute policy={shippingPolicies.list}>
        <Suspense fallback={<PageLoader />}>
          <DeliveryRoutesPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/drivers",
    element: (
      <ProtectedRoute policy={shippingPolicies.list}>
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
      <ProtectedRoute policy={pricingPolicies.manageTariffs}>
        <Suspense fallback={<PageLoader />}>
          <TariffsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/stores",
    element: (
      <ProtectedRoute policy={iamPolicies.manageStores}>
        <Suspense fallback={<PageLoader />}>
          <StoresPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/zones",
    element: (
      <ProtectedRoute policy={pricingPolicies.manageZones}>
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
      <ProtectedRoute policy={iamPolicies.manageUsers}>
        <Suspense fallback={<PageLoader />}>
          <UsersPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },

  // Configuración
  {
    path: "/settings",
    element: (
      <ProtectedRoute policy={settingsPolicies.manage}>
        <Suspense fallback={<PageLoader />}>
          <SettingsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
];
