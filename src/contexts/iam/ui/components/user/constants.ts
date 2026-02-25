import { PERMISSIONS, type Permission } from "../../../domain/schemas/user/UserRole";

export const ROLE_PRESETS: { name: string; permissions: Permission[] }[] = [
  { name: "Administrador", permissions: [...PERMISSIONS] },
  { name: "Vendedor", permissions: ["CAN_SELL", "CAN_MANAGE_CUSTOMERS"] },
  { name: "Bodeguero", permissions: ["CAN_MANAGE_INVENTORY"] },
  { name: "Auditor", permissions: ["CAN_VIEW_REPORTS"] },
];

export const PERMISSION_LABELS: Record<Permission, string> = {
  CAN_SELL: "Vender",
  CAN_CREATE_HQ_ORDERS: "Crear órdenes HQ",
  CAN_SELL_BOXES: "Vender cajas",
  CAN_MANAGE_INVENTORY: "Gestionar inventario",
  CAN_MANAGE_USERS: "Gestionar usuarios",
  CAN_VIEW_REPORTS: "Ver reportes",
  CAN_MANAGE_CUSTOMERS: "Gestionar clientes",
  CAN_MANAGE_STORES: "Gestionar tiendas",
  CAN_MANAGE_ZONES: "Gestionar zonas",
  CAN_MANAGE_TARIFFS: "Gestionar tarifas",
  CAN_SHIP: "Enviar paquetes",
  CAN_MANAGE_WAREHOUSE: "Gestionar bodega",
};


