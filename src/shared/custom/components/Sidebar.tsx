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
} from '@/shared/shadcn/components';
import { useAuth } from '@/contexts/iam/infrastructure/hooks';
import type { Permission } from '@/contexts/iam/domain';

interface NavItem {
  label: string;
  href: string;
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
      { label: 'Clientes', href: '/customers', permissions: ['CAN_MANAGE_CUSTOMERS'] },
      { label: 'Órdenes', href: '/orders', permissions: ['CAN_SELL'] },
      { label: 'Bodega', href: '/warehouse', permissions: ['CAN_MANAGE_INVENTORY'] },
    ],
  },
  {
    title: 'Inventario',
    items: [
      { label: 'Cajas', href: '/boxes', permissions: ['CAN_MANAGE_INVENTORY'] },
    ],
  },
  {
    title: 'Logística',
    items: [
      { label: 'Rutas de Entrega', href: '/delivery-routes', permissions: ['CAN_SELL'] },
      { label: 'Conductores', href: '/drivers', permissions: ['CAN_SELL'] },
    ],
  },
  {
    title: 'Operaciones',
    items: [
      { label: 'Tarifas', href: '/tariffs', permissions: ['CAN_MANAGE_TARIFFS'] },
      { label: 'Zonas', href: '/zones', permissions: ['CAN_MANAGE_ZONES'] },
    ],
  },
  {
    title: 'Administración',
    items: [
      { label: 'Tiendas', href: '/stores', permissions: ['CAN_MANAGE_STORES'] },
      { label: 'Usuarios', href: '/users', permissions: ['CAN_MANAGE_USERS'] },
      { label: 'Roles', href: '/roles', permissions: ['CAN_MANAGE_USERS'] },
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
                      <Link to={item.href}>{item.label}</Link>
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
