import type { RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@/shared/custom/components";

// Sales
import {
  OrdersPage,
  NewOrderPage,
  CustomersPage,
  WarehousePage,
} from "@/contexts/sales/ui/pages";

// Inventory
import { BoxPage } from "@/contexts/inventory/ui/pages";

// Shipping
import { DeliveryRoutesPage, DriversPage } from "@/contexts/shipping/ui/pages";

// Pricing
import {
  TariffsPage,
  ZonesPage,
} from "@/contexts/pricing/ui/pages";

// IAM
import { UsersPage, RolesPage, StoresPage } from "@/contexts/iam/ui/pages";

// Dashboard
import { DashboardPage } from "@/shared/custom/pages";

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
