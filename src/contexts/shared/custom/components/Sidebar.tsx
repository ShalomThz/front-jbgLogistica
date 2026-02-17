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
import type { Permission } from '@/contexts/iam/domain/schemas/user/UserRole';
import type { LucideIcon } from 'lucide-react';
import {
  Users,
  ShoppingCart,
  Warehouse,
  Package,
  Route,
  Truck,
  DollarSign,
  MapPin,
  Store,
  UserCog,
  Shield,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permissions?: Permission[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    title: 'Ventas',
    items: [
      { label: 'Clientes', href: '/customers', icon: Users, permissions: ['CAN_MANAGE_CUSTOMERS'] },
      { label: 'Órdenes', href: '/orders', icon: ShoppingCart, permissions: ['CAN_SELL'] },
      { label: 'Bodega', href: '/warehouse', icon: Warehouse, permissions: ['CAN_MANAGE_INVENTORY'] },
    ],
  },
  {
    title: 'Inventario',
    items: [
      { label: 'Cajas', href: '/boxes', icon: Package, permissions: ['CAN_MANAGE_INVENTORY'] },
    ],
  },
  {
    title: 'Logística',
    items: [
      { label: 'Rutas de Entrega', href: '/delivery-routes', icon: Route, permissions: ['CAN_SELL'] },
      { label: 'Conductores', href: '/drivers', icon: Truck, permissions: ['CAN_SELL'] },
    ],
  },
  {
    title: 'Operaciones',
    items: [
      { label: 'Tarifas', href: '/tariffs', icon: DollarSign, permissions: ['CAN_MANAGE_TARIFFS'] },
      { label: 'Zonas', href: '/zones', icon: MapPin, permissions: ['CAN_MANAGE_ZONES'] },
    ],
  },
  {
    title: 'Administración',
    items: [
      { label: 'Tiendas', href: '/stores', icon: Store, permissions: ['CAN_MANAGE_STORES'] },
      { label: 'Usuarios', href: '/users', icon: UserCog, permissions: ['CAN_MANAGE_USERS'] },
      { label: 'Roles', href: '/roles', icon: Shield, permissions: ['CAN_MANAGE_USERS'] },
    ],
  },
];

export const AppSidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const userPermissions = user?.role.permissions ?? [];

  const hasPermission = (requiredPermissions?: Permission[]) => {
    if (!requiredPermissions || requiredPermissions.length === 0) return true;
    return requiredPermissions.some((p) => userPermissions.includes(p));
  };

  const filteredNavigation = navigation
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => hasPermission(item.permissions)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      <SidebarHeader className="h-16 flex items-center justify-center border-b border-border">
        <Link to="/" className="px-2 text-xl font-bold">JBG</Link>
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
