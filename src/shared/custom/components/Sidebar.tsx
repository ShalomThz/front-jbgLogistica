import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon?: ReactNode;
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

export const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <Link to="/" className="text-xl font-bold text-gray-800">JBG</Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        {navigation.map((section) => (
          <div key={section.title} className="mb-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {section.title}
            </h2>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={`block px-3 py-2 text-sm rounded transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
};
