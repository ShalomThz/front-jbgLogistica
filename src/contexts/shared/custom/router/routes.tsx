import type { RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@contexts/shared/custom/components";

// Sales
import { OrdersPage } from "@contexts/order-flow/ui/pages/OrdersPage";
import { NewOrderPage } from "@contexts/order-flow/ui/pages/NewOrderPage";
import { EditOrderPage } from "@contexts/order-flow/ui/pages/EditOrderPage";
import { CustomersPage } from "@contexts/sales/ui/pages/CustomersPage";
import { WarehousePage } from "@contexts/sales/ui/pages/WarehousePage";

// Inventory
import { BoxPage } from "@contexts/inventory/ui/pages/BoxPage";

// Shipping
import { DeliveryRoutesPage } from "@contexts/shipping/ui/pages/DeliveryRoutesPage";
import { DriversPage } from "@contexts/shipping/ui/pages/DriversPage";

// Pricing
import { TariffsPage } from "@contexts/pricing/ui/pages/TariffsPage";
import { ZonesPage } from "@contexts/pricing/ui/pages/ZonesPage";

// IAM
import { UsersPage } from "@contexts/iam/ui/pages/UsersPage";
import { RolesPage } from "@contexts/iam/ui/pages/RolesPage";
import { StoresPage } from "@contexts/iam/ui/pages/StoresPage";

// Dashboard
import { DashboardPage } from "@contexts/shared/custom/pages";

export const routes: RouteObject[] = [
  // Dashboard - acceso general para usuarios autenticados
  { path: "/", element: <DashboardPage /> },

  // Ventas
  {
    path: "/customers",
    element: (
      <ProtectedRoute permissions={["CAN_MANAGE_CUSTOMERS"]}>
        <CustomersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/orders",
    element: (
      <ProtectedRoute permissions={["CAN_SELL"]}>
        <OrdersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/orders/new",
    element: (
      <ProtectedRoute permissions={["CAN_SELL"]}>
        <NewOrderPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/orders/:id/edit",
    element: (
      <ProtectedRoute permissions={["CAN_SELL"]}>
        <EditOrderPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/warehouse",
    element: (
      <ProtectedRoute permissions={["CAN_MANAGE_INVENTORY"]}>
        <WarehousePage />
      </ProtectedRoute>
    ),
  },

  // Inventario
  {
    path: "/boxes",
    element: (
      <ProtectedRoute permissions={["CAN_MANAGE_INVENTORY"]}>
        <BoxPage />
      </ProtectedRoute>
    ),
  },

  // Logística
  {
    path: "/delivery-routes",
    element: (
      <ProtectedRoute permissions={["CAN_SELL"]}>
        <DeliveryRoutesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/drivers",
    element: (
      <ProtectedRoute permissions={["CAN_SELL"]}>
        <DriversPage />
      </ProtectedRoute>
    ),
  },

  // Operaciones
  {
    path: "/tariffs",
    element: (
      <ProtectedRoute permissions={["CAN_MANAGE_TARIFFS"]}>
        <TariffsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/stores",
    element: (
      <ProtectedRoute permissions={["CAN_MANAGE_STORES"]}>
        <StoresPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/zones",
    element: (
      <ProtectedRoute permissions={["CAN_MANAGE_ZONES"]}>
        <ZonesPage />
      </ProtectedRoute>
    ),
  },

  // Administración
  {
    path: "/users",
    element: (
      <ProtectedRoute permissions={["CAN_MANAGE_USERS"]}>
        <UsersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/roles",
    element: (
      <ProtectedRoute permissions={["CAN_MANAGE_USERS"]}>
        <RolesPage />
      </ProtectedRoute>
    ),
  },
];
