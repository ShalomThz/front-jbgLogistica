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
  SidebarSeparator,
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
      { label: 'Nueva Orden', href: '/sales/new' },
      { label: 'Órdenes', href: '/sales/orders' },
      { label: 'Clientes', href: '/sales/customers' },
    ],
  },
  {
    title: 'Fulfillment',
    items: [
      { label: 'Escanear', href: '/fulfillment/scan' },
      { label: 'Guías', href: '/fulfillment/waybills' },
    ],
  },
  {
    title: 'Inventario',
    items: [
      { label: 'Stock', href: '/inventory/stock' },
    ],
  },
  {
    title: 'Almacén',
    items: [
      { label: 'Rositas', href: '/warehouse/storage' },
    ],
  },
  {
    title: 'Configuración',
    items: [
      { label: 'Zonas', href: '/config/zones' },
      { label: 'Tarifas', href: '/config/tariffs' },
      { label: 'Cajas', href: '/config/boxes' },
    ],
  },
];

export const AppSidebar = () => {
  const location = useLocation();

  return (
    <>
      <SidebarHeader>
        <Link to="/" className="px-2 text-xl font-bold">JBG</Link>
      </SidebarHeader>
      <SidebarSeparator />
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
                      isActive={location.pathname === item.href}
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
