import type { RouteObject } from 'react-router-dom';

// Sales Counter
import { OrdersPage, NewOrderPage, CustomersPage } from '@/contexts/sales-counter/ui/pages';

// Warehouse Storage
import { StoragePage } from '@/contexts/warehouse-storage/ui/pages';

// Inventory
import { ProductsPage, StockPage, PurchasesPage } from '@/contexts/inventory/ui/pages';

// Shipping Fulfillment
import { DeliveryRoutesPage, DriversPage } from '@/contexts/shipping-fulfillment/ui/pages';

// Pricing Catalogue
import { TariffsPage, StoresPage, ZonesPage } from '@/contexts/pricing-catalogue/ui/pages';

// Users
import { UsersPage, RolesPage } from '@/contexts/users/ui/pages';

// Dashboard
import { DashboardPage } from '@/shared/custom/pages';

export const routes: RouteObject[] = [
  { path: '/', element: <DashboardPage /> },
  // Ventas
  { path: '/customers', element: <CustomersPage /> },
  { path: '/orders', element: <OrdersPage /> },
  { path: '/orders/new', element: <NewOrderPage /> },
  { path: '/warehouse', element: <StoragePage /> },
  // Inventario
  { path: '/products', element: <ProductsPage /> },
  { path: '/inventory', element: <StockPage /> },
  { path: '/purchases', element: <PurchasesPage /> },
  // Logística
  { path: '/delivery-routes', element: <DeliveryRoutesPage /> },
  { path: '/drivers', element: <DriversPage /> },
  // Operaciones
  { path: '/tariffs', element: <TariffsPage /> },
  { path: '/stores', element: <StoresPage /> },
  { path: '/zones', element: <ZonesPage /> },
  // Administración
  { path: '/users', element: <UsersPage /> },
  { path: '/roles', element: <RolesPage /> },
];
