import type { LucideIcon } from "lucide-react";
import {
  ShoppingCart,
  Building2,
  Users,
  Package,
  Warehouse,
  DollarSign,
  MapPin,
  Truck,
  Store,
  UserCog,
  Settings,
} from "lucide-react";
import {
  PERMISSIONS,
  type Permission,
} from "../../../domain/schemas/user/UserRole";

export const ROLE_PRESETS: { name: string; permissions: Permission[] }[] = [
  { name: "Administrador", permissions: [...PERMISSIONS] },
  {
    name: "Vendedor",
    permissions: [
      "CAN_LIST_PARTNER_ORDERS",
      "CAN_VIEW_PARTNER_ORDERS",
      "CAN_CREATE_PARTNER_ORDERS",
      "CAN_EDIT_PARTNER_ORDERS",
      "CAN_DELETE_PARTNER_ORDERS",
      "CAN_LIST_CUSTOMERS",
      "CAN_VIEW_CUSTOMERS",
      "CAN_CREATE_CUSTOMERS",
      "CAN_EDIT_CUSTOMERS",
    ],
  },
  {
    name: "Bodeguero",
    permissions: [
      "CAN_LIST_PACKAGES",
      "CAN_VIEW_PACKAGES",
      "CAN_VIEW_PACKAGE_RECEIPT",
      "CAN_CREATE_PACKAGES",
      "CAN_EDIT_PACKAGES",
    ],
  },
  { name: "Auditor", permissions: ["CAN_VIEW_REPORTS"] },
];

export const PERMISSION_LABELS: Record<Permission, string> = {
  // Partner Orders
  CAN_LIST_PARTNER_ORDERS: "Listar órdenes partner",
  CAN_LIST_ALL_PARTNER_ORDERS: "Listar todas las órdenes partner",
  CAN_VIEW_PARTNER_ORDERS: "Ver órdenes partner",
  CAN_CREATE_PARTNER_ORDERS: "Crear órdenes partner",
  CAN_EDIT_PARTNER_ORDERS: "Editar órdenes partner",
  CAN_DELETE_PARTNER_ORDERS: "Eliminar órdenes partner",

  // HQ Orders
  CAN_LIST_HQ_ORDERS: "Listar órdenes JBG",
  CAN_LIST_ALL_HQ_ORDERS: "Listar todas las órdenes JBG",
  CAN_VIEW_HQ_ORDERS: "Ver órdenes JBG",
  CAN_CREATE_HQ_ORDERS: "Crear órdenes JBG",
  CAN_EDIT_HQ_ORDERS: "Editar órdenes JBG",
  CAN_DELETE_HQ_ORDERS: "Eliminar órdenes JBG",

  // Customers
  CAN_LIST_CUSTOMERS: "Listar clientes",
  CAN_LIST_ALL_CUSTOMERS: "Listar todos los clientes",
  CAN_VIEW_CUSTOMERS: "Ver clientes",
  CAN_CREATE_CUSTOMERS: "Crear clientes",
  CAN_EDIT_CUSTOMERS: "Editar clientes",
  CAN_DELETE_CUSTOMERS: "Eliminar clientes",
  CAN_PROVISION_CUSTOMER_ACCESS: "Provisionar acceso a clientes",

  // Users
  CAN_LIST_USERS: "Listar usuarios",
  CAN_VIEW_USERS: "Ver usuarios",
  CAN_CREATE_USERS: "Crear usuarios",
  CAN_EDIT_USERS: "Editar usuarios",
  CAN_DELETE_USERS: "Eliminar usuarios",

  // Stores
  CAN_LIST_STORES: "Listar tiendas",
  CAN_VIEW_STORES: "Ver tiendas",
  CAN_CREATE_STORES: "Crear tiendas",
  CAN_EDIT_STORES: "Editar tiendas",
  CAN_DELETE_STORES: "Eliminar tiendas",

  // Boxes
  CAN_LIST_BOXES: "Listar cajas",
  CAN_VIEW_BOXES: "Ver cajas",
  CAN_CREATE_BOXES: "Crear cajas",
  CAN_EDIT_BOXES: "Editar cajas",
  CAN_DELETE_BOXES: "Eliminar cajas",
  CAN_SELL_BOXES: "Vender cajas",
  CAN_LIST_BOX_SALES: "Listar ventas de cajas",

  // Warehouse
  CAN_LIST_PACKAGES: "Listar paquetes",
  CAN_VIEW_PACKAGES: "Ver paquetes",
  CAN_VIEW_PACKAGE_RECEIPT: "Ver recibo de paquete",
  CAN_CREATE_PACKAGES: "Crear paquetes",
  CAN_EDIT_PACKAGES: "Editar paquetes",
  CAN_DELETE_PACKAGES: "Eliminar paquetes",
  CAN_VIEW_OWN_PACKAGES: "Ver mis paquetes",

  // Shipping
  CAN_LIST_SHIPMENTS: "Listar envíos",
  CAN_FULFILL_SHIPMENTS: "Completar envíos",
  CAN_VIEW_SHIPMENT_RATES: "Ver tarifas de envío",
  CAN_SELECT_SHIPMENT_PROVIDER: "Seleccionar proveedor de envío",
  CAN_VIEW_SHIPMENT_LABEL: "Ver etiqueta de envío",
  CAN_CANCEL_SHIPMENTS: "Cancelar envíos",

  // Tariffs
  CAN_LIST_TARIFFS: "Listar tarifas",
  CAN_VIEW_TARIFFS: "Ver tarifas",
  CAN_CREATE_TARIFFS: "Crear tarifas",
  CAN_EDIT_TARIFFS: "Editar tarifas",
  CAN_DELETE_TARIFFS: "Eliminar tarifas",

  // Zones
  CAN_LIST_ZONES: "Listar zonas",
  CAN_VIEW_ZONES: "Ver zonas",
  CAN_CREATE_ZONES: "Crear zonas",
  CAN_EDIT_ZONES: "Editar zonas",
  CAN_DELETE_ZONES: "Eliminar zonas",

  // Settings
  CAN_VIEW_SETTINGS: "Ver configuración",
  CAN_EDIT_SETTINGS: "Editar configuración",

  // Reports
  CAN_VIEW_REPORTS: "Ver reportes",
};

export const PERMISSION_GROUPS: {
  label: string;
  icon: LucideIcon;
  permissions: Permission[];
}[] = [
    {
      label: "Órdenes Partner",
      icon: ShoppingCart,
      permissions: [
        "CAN_LIST_PARTNER_ORDERS",
        "CAN_LIST_ALL_PARTNER_ORDERS",
        "CAN_VIEW_PARTNER_ORDERS",
        "CAN_CREATE_PARTNER_ORDERS",
        "CAN_EDIT_PARTNER_ORDERS",
        "CAN_DELETE_PARTNER_ORDERS",
      ],
    },
    {
      label: "Órdenes JBG",
      icon: Building2,
      permissions: [
        "CAN_LIST_HQ_ORDERS",
        "CAN_LIST_ALL_HQ_ORDERS",
        "CAN_VIEW_HQ_ORDERS",
        "CAN_CREATE_HQ_ORDERS",
        "CAN_EDIT_HQ_ORDERS",
        "CAN_DELETE_HQ_ORDERS",
      ],
    },
    {
      label: "Clientes",
      icon: Users,
      permissions: [
        "CAN_LIST_CUSTOMERS",
        "CAN_LIST_ALL_CUSTOMERS",
        "CAN_VIEW_CUSTOMERS",
        "CAN_CREATE_CUSTOMERS",
        "CAN_EDIT_CUSTOMERS",
        "CAN_DELETE_CUSTOMERS",
        "CAN_PROVISION_CUSTOMER_ACCESS",
      ],
    },
    {
      label: "Cajas",
      icon: Package,
      permissions: [
        "CAN_LIST_BOXES",
        "CAN_VIEW_BOXES",
        "CAN_CREATE_BOXES",
        "CAN_EDIT_BOXES",
        "CAN_DELETE_BOXES",
        "CAN_SELL_BOXES",
        "CAN_LIST_BOX_SALES",
      ],
    },
    {
      label: "Bodega",
      icon: Warehouse,
      permissions: [
        "CAN_LIST_PACKAGES",
        "CAN_VIEW_PACKAGES",
        "CAN_VIEW_PACKAGE_RECEIPT",
        "CAN_CREATE_PACKAGES",
        "CAN_EDIT_PACKAGES",
        "CAN_DELETE_PACKAGES",
        "CAN_VIEW_OWN_PACKAGES",
      ],
    },
    {
      label: "Envíos",
      icon: Truck,
      permissions: [
        "CAN_LIST_SHIPMENTS",
        "CAN_FULFILL_SHIPMENTS",
        "CAN_VIEW_SHIPMENT_RATES",
        "CAN_SELECT_SHIPMENT_PROVIDER",
        "CAN_VIEW_SHIPMENT_LABEL",
        "CAN_CANCEL_SHIPMENTS",
      ],
    },
    {
      label: "Tarifas",
      icon: DollarSign,
      permissions: [
        "CAN_LIST_TARIFFS",
        "CAN_VIEW_TARIFFS",
        "CAN_CREATE_TARIFFS",
        "CAN_EDIT_TARIFFS",
        "CAN_DELETE_TARIFFS",
      ],
    },
    {
      label: "Zonas",
      icon: MapPin,
      permissions: [
        "CAN_LIST_ZONES",
        "CAN_VIEW_ZONES",
        "CAN_CREATE_ZONES",
        "CAN_EDIT_ZONES",
        "CAN_DELETE_ZONES",
      ],
    },
    {
      label: "Tiendas",
      icon: Store,
      permissions: [
        "CAN_LIST_STORES",
        "CAN_VIEW_STORES",
        "CAN_CREATE_STORES",
        "CAN_EDIT_STORES",
        "CAN_DELETE_STORES",
      ],
    },
    {
      label: "Usuarios",
      icon: UserCog,
      permissions: [
        "CAN_LIST_USERS",
        "CAN_VIEW_USERS",
        "CAN_CREATE_USERS",
        "CAN_EDIT_USERS",
        "CAN_DELETE_USERS",
      ],
    },
    {
      label: "Configuración",
      icon: Settings,
      permissions: [
        "CAN_VIEW_SETTINGS",
        "CAN_EDIT_SETTINGS",
        "CAN_VIEW_REPORTS",
      ],
    },
  ];
