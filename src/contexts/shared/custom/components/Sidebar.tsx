import { Link, useLocation } from 'react-router-dom';
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@contexts/shared/shadcn/components';
import { useAuth } from '@contexts/iam/infrastructure/hooks/auth/useAuth';
import type { Policy } from '@contexts/shared/custom/policies/Policy';
import { customerPolicies } from '@contexts/shared/custom/policies/customer.policy';
import { orderPolicies } from '@contexts/shared/custom/policies/order.policy';
import { warehousePolicies } from '@contexts/shared/custom/policies/warehouse.policy';
import { boxPolicies } from '@contexts/shared/custom/policies/box.policy';
import { pricingPolicies } from '@contexts/shared/custom/policies/pricing.policy';
import { iamPolicies } from '@contexts/shared/custom/policies/iam.policy';
import type { LucideIcon } from 'lucide-react';
import {
  Users,
  ShoppingCart,
  Warehouse,
  Package,
  Receipt,
  DollarSign,
  MapPin,
  Store,
  UserCog,
  Truck,
  Route,
  IdCard,
} from 'lucide-react';
import { shippingPolicies } from '../policies/shipping.policy';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  policy?: Policy;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    title: 'Ventas',
    items: [
      { label: 'Clientes', href: '/customers', icon: Users, policy: customerPolicies.manage },
      { label: 'Órdenes', href: '/orders', icon: ShoppingCart, policy: orderPolicies.list },
      { label: 'Bodega', href: '/warehouse', icon: Warehouse, policy: warehousePolicies.manage },
    ],
  },
  {
    title: 'Inventario',
    items: [
      { label: 'Cajas', href: '/boxes', icon: Package, policy: boxPolicies.manage },
      { label: 'Venta de Cajas', href: '/box-sales', icon: Receipt, policy: boxPolicies.sell },
    ],
  },
  {
    title: 'Operaciones',
    items: [
      { label: 'Rutas', href: '/routes', icon: Route, policy: shippingPolicies.manageRoute },
      { label: 'Conductores', href: '/drivers', icon: IdCard, policy: shippingPolicies.manageDriver },
      { label: 'Mi ruta', href: '/driver-workspace', icon: Truck, policy: shippingPolicies.driverRoute },
      { label: 'Tarifas', href: '/tariffs', icon: DollarSign, policy: pricingPolicies.manageTariffs },
      { label: 'Zonas', href: '/zones', icon: MapPin, policy: pricingPolicies.manageZones },
    ],
  },
  {
    title: 'Administración',
    items: [
      { label: 'Tiendas', href: '/stores', icon: Store, policy: iamPolicies.manageStores },
      { label: 'Usuarios', href: '/users', icon: UserCog, policy: iamPolicies.manageUsers },
    ],
  },
];

export const AppSidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const filteredNavigation = navigation
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        !item.policy || (user && item.policy(user)),
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      <SidebarHeader className="h-16 flex items-center justify-center border-b border-border">
        <Link to="/" className="px-2 text-xl font-bold">JBG Cargo Corp</Link>
      </SidebarHeader>
      <SidebarContent>
        {filteredNavigation.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname.startsWith(item.href)}
                      className="data-[active=true]:text-primary"
                    >
                      <Link to={item.href}>
                        <item.icon className="size-4" />
                        {item.label}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </>
  );
};
