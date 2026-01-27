import type { RouteObject } from 'react-router-dom';

// Sales Counter
import { OrdersPage, NewOrderPage, CustomersPage } from '@/contexts/sales-counter/ui/pages';

// Shipping Fulfillment
import { ScanPage, WaybillsPage } from '@/contexts/shipping-fulfillment/ui/pages';

// Inventory
import { StockPage } from '@/contexts/inventory/ui/pages';

// Warehouse Storage
import { StoragePage } from '@/contexts/warehouse-storage/ui/pages';

// Pricing Catalogue
import { ZonesPage, TariffsPage, BoxesPage } from '@/contexts/pricing-catalogue/ui/pages';

// Dashboard
import { DashboardPage } from '@/shared/ui/pages';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <DashboardPage />,
  },
  // Sales
  {
    path: '/sales/orders',
    element: <OrdersPage />,
  },
  {
    path: '/sales/new',
    element: <NewOrderPage />,
  },
  {
    path: '/sales/customers',
    element: <CustomersPage />,
  },
  // Fulfillment
  {
    path: '/fulfillment/scan',
    element: <ScanPage />,
  },
  {
    path: '/fulfillment/waybills',
    element: <WaybillsPage />,
  },
  // Inventory
  {
    path: '/inventory/stock',
    element: <StockPage />,
  },
  // Warehouse
  {
    path: '/warehouse/storage',
    element: <StoragePage />,
  },
  // Config
  {
    path: '/config/zones',
    element: <ZonesPage />,
  },
  {
    path: '/config/tariffs',
    element: <TariffsPage />,
  },
  {
    path: '/config/boxes',
    element: <BoxesPage />,
  },
];
