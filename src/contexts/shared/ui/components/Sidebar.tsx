import { useState } from 'react';
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@contexts/shared/shadcn/components';
import { useAuth } from '@contexts/iam/infrastructure/hooks/auth/useAuth';
import type { Policy } from '@contexts/shared/domain/policies/Policy';
import { customerPolicies } from '@contexts/shared/domain/policies/customer.policy';
import { orderPolicies } from '@contexts/shared/domain/policies/order.policy';
import { warehousePolicies } from '@contexts/shared/domain/policies/warehouse.policy';
import { boxPolicies } from '@contexts/shared/domain/policies/box.policy';
import { pricingPolicies } from '@contexts/shared/domain/policies/pricing.policy';
import { iamPolicies } from '@contexts/shared/domain/policies/iam.policy';
import type { LucideIcon } from 'lucide-react';
import {
  Users,
  ShoppingCart,
  Warehouse,
  Package,
  Receipt,
  History,
  DollarSign,
  MapPin,
  Store,
  UserCog,
  Route,
  IdCard,
  ChevronRight,
  Truck,
  PackageOpen,
  Box,
} from 'lucide-react';
import { shippingPolicies } from '../../domain/policies/shipping.policy';
import logo from '@/assets/JBG_CARGO_CORP_logo.png';
import logoDark from '@/assets/JBG_CARGO_CORP_blanco.png';
 
interface NavSubItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  policy?: Policy;
  /** Sub-páginas desplegables bajo el item (p. ej. los tipos de ruta). */
  subItems?: NavSubItem[];
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
      { label: 'Inventario de Cajas', href: '/boxes', icon: Package, policy: boxPolicies.manage },
      { label: 'Venta de Cajas', href: '/box-sales', icon: Receipt, policy: boxPolicies.sell },
      { label: 'Historial Venta de Cajas', href: '/box-sales-history', icon: History, policy: boxPolicies.listSales },
    ],
  },
  {
    title: 'Operaciones',
    items: [
      {
        label: 'Rutas',
        href: '/routes',
        icon: Route,
        policy: shippingPolicies.listRoutes,
        subItems: [
          { label: 'Entrega', href: '/routes/delivery', icon: Truck },
          { label: 'Recolección', href: '/routes/picking', icon: PackageOpen },
          { label: 'Cajas vacías', href: '/routes/box-drop', icon: Box },
        ],
      },
      { label: 'Conductores', href: '/drivers', icon: IdCard, policy: shippingPolicies.listDrivers },
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

const ExpandableNavItem = ({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate: () => void;
}) => {
  const location = useLocation();
  const isSectionActive = location.pathname.startsWith(`${item.href}/`);
  const [open, setOpen] = useState(isSectionActive);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => setOpen((v) => !v)}
        isActive={isSectionActive}
        className="data-[active=true]:text-primary"
      >
        <item.icon className="size-4" />
        {item.label}
        <ChevronRight
          className={`ml-auto size-4 transition-transform ${open ? 'rotate-90' : ''}`}
        />
      </SidebarMenuButton>
      {open && (
        <SidebarMenuSub>
          {item.subItems?.map((subItem) => (
            <SidebarMenuSubItem key={subItem.href}>
              <SidebarMenuSubButton
                asChild
                isActive={location.pathname === subItem.href}
                className="data-[active=true]:text-primary"
              >
                <Link to={subItem.href} onClick={onNavigate}>
                  <subItem.icon className="size-4" />
                  <span>{subItem.label}</span>
                </Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
};

export const AppSidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

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
      <SidebarHeader className="h-16 flex items-center justify-center overflow-hidden border-b border-border">
        <Link to="/" onClick={handleNavClick} className="flex items-center justify-center">
          <img src={logo} alt="JBG Cargo Corp" className="h-16 w-auto scale-110 object-contain dark:hidden" />
          <img src={logoDark} alt="JBG Cargo Corp" className="hidden h-16 w-auto scale-110 object-contain dark:block" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {filteredNavigation.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) =>
                  item.subItems ? (
                    <ExpandableNavItem
                      key={item.href}
                      item={item}
                      onNavigate={handleNavClick}
                    />
                  ) : (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={
                          location.pathname === item.href ||
                          location.pathname.startsWith(`${item.href}/`)
                        }
                        className="data-[active=true]:text-primary"
                      >
                        <Link to={item.href} onClick={handleNavClick}>
                          <item.icon className="size-4" />
                          {item.label}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ),
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </>
  );
};
