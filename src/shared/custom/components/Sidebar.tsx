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

interface NavItem {
  label: string;
  href: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    title: 'Ventas',
    items: [
      { label: 'Clientes', href: '/customers' },
      { label: 'Órdenes', href: '/orders' },
      { label: 'Bodega', href: '/warehouse' },
    ],
  },
  {
    title: 'Inventario',
    items: [
      { label: 'Productos', href: '/products' },
      { label: 'Inventario', href: '/inventory' },
      { label: 'Compras', href: '/purchases' },
    ],
  },
  {
    title: 'Logística',
    items: [
      { label: 'Rutas de Entrega', href: '/delivery-routes' },
      { label: 'Conductores', href: '/drivers' },
    ],
  },
  {
    title: 'Operaciones',
    items: [
      { label: 'Tarifas', href: '/tariffs' },
      { label: 'Tiendas', href: '/stores' },
      { label: 'Zonas', href: '/zones' },
    ],
  },
  {
    title: 'Administración',
    items: [
      { label: 'Usuarios', href: '/users' },
      { label: 'Roles', href: '/roles' },
    ],
  },
];

export const AppSidebar = () => {
  const location = useLocation();

  return (
    <>
      <SidebarHeader className="h-16 flex items-center justify-center border-b border-border">
        <Link to="/" className="px-2 text-xl font-bold">JBG</Link>
      </SidebarHeader>
      <SidebarContent>
        {navigation.map((section) => (
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
