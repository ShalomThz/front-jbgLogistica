import type { Permission } from "./UserRole";

// Dependencias: al activar la key, se auto-activan los values
export const PERMISSION_DEPS: Partial<Record<Permission, Permission[]>> = {
  // Orders - Partner
  CAN_VIEW_PARTNER_ORDERS: ["CAN_LIST_ORDERS"],
  CAN_CREATE_PARTNER_ORDERS: ["CAN_LIST_ORDERS", "CAN_VIEW_PARTNER_ORDERS"],
  CAN_EDIT_PARTNER_ORDERS: ["CAN_LIST_ORDERS", "CAN_VIEW_PARTNER_ORDERS"],
  CAN_DELETE_PARTNER_ORDERS: ["CAN_LIST_ORDERS", "CAN_VIEW_PARTNER_ORDERS"],
  // Orders - HQ
  CAN_VIEW_HQ_ORDERS: ["CAN_LIST_ORDERS"],
  CAN_CREATE_HQ_ORDERS: ["CAN_LIST_ORDERS", "CAN_VIEW_HQ_ORDERS"],
  CAN_EDIT_HQ_ORDERS: ["CAN_LIST_ORDERS", "CAN_VIEW_HQ_ORDERS"],
  CAN_DELETE_HQ_ORDERS: ["CAN_LIST_ORDERS", "CAN_VIEW_HQ_ORDERS"],
  // Orders - cross
  CAN_LIST_ALL_ORDERS: ["CAN_LIST_ORDERS"],

  // Customers
  CAN_VIEW_CUSTOMERS: ["CAN_LIST_CUSTOMERS"],
  CAN_CREATE_CUSTOMERS: ["CAN_LIST_CUSTOMERS", "CAN_VIEW_CUSTOMERS"],
  CAN_EDIT_CUSTOMERS: ["CAN_LIST_CUSTOMERS", "CAN_VIEW_CUSTOMERS"],
  CAN_DELETE_CUSTOMERS: ["CAN_LIST_CUSTOMERS", "CAN_VIEW_CUSTOMERS"],
  CAN_PROVISION_CUSTOMER_ACCESS: ["CAN_LIST_CUSTOMERS", "CAN_VIEW_CUSTOMERS"],
  CAN_LIST_ALL_CUSTOMERS: ["CAN_LIST_CUSTOMERS"],

  // Users
  CAN_VIEW_USERS: ["CAN_LIST_USERS"],
  CAN_CREATE_USERS: ["CAN_LIST_USERS", "CAN_VIEW_USERS"],
  CAN_EDIT_USERS: ["CAN_LIST_USERS", "CAN_VIEW_USERS"],
  CAN_DELETE_USERS: ["CAN_LIST_USERS", "CAN_VIEW_USERS"],

  // Stores
  CAN_VIEW_STORES: ["CAN_LIST_STORES"],
  CAN_CREATE_STORES: ["CAN_LIST_STORES", "CAN_VIEW_STORES"],
  CAN_EDIT_STORES: ["CAN_LIST_STORES", "CAN_VIEW_STORES"],
  CAN_DELETE_STORES: ["CAN_LIST_STORES", "CAN_VIEW_STORES"],

  // Boxes
  CAN_VIEW_BOXES: ["CAN_LIST_BOXES"],
  CAN_CREATE_BOXES: ["CAN_LIST_BOXES", "CAN_VIEW_BOXES"],
  CAN_EDIT_BOXES: ["CAN_LIST_BOXES", "CAN_VIEW_BOXES"],
  CAN_DELETE_BOXES: ["CAN_LIST_BOXES", "CAN_VIEW_BOXES"],
  CAN_SELL_BOXES: ["CAN_LIST_BOXES", "CAN_VIEW_BOXES"],
  CAN_LIST_BOX_SALES: ["CAN_LIST_BOXES"],

  // Warehouse
  CAN_VIEW_PACKAGES: ["CAN_LIST_PACKAGES"],
  CAN_VIEW_PACKAGE_RECEIPT: ["CAN_LIST_PACKAGES", "CAN_VIEW_PACKAGES"],
  CAN_CREATE_PACKAGES: ["CAN_LIST_PACKAGES", "CAN_VIEW_PACKAGES"],
  CAN_EDIT_PACKAGES: ["CAN_LIST_PACKAGES", "CAN_VIEW_PACKAGES"],
  CAN_DELETE_PACKAGES: ["CAN_LIST_PACKAGES", "CAN_VIEW_PACKAGES"],

  // Shipping
  CAN_FULFILL_SHIPMENTS: ["CAN_LIST_SHIPMENTS"],
  CAN_VIEW_SHIPMENT_RATES: ["CAN_LIST_SHIPMENTS"],
  CAN_SELECT_SHIPMENT_PROVIDER: ["CAN_LIST_SHIPMENTS"],
  CAN_VIEW_SHIPMENT_LABEL: ["CAN_LIST_SHIPMENTS"],
  CAN_CANCEL_SHIPMENTS: ["CAN_LIST_SHIPMENTS"],

  // Tariffs
  CAN_VIEW_TARIFFS: ["CAN_LIST_TARIFFS"],
  CAN_CREATE_TARIFFS: ["CAN_LIST_TARIFFS", "CAN_VIEW_TARIFFS"],
  CAN_EDIT_TARIFFS: ["CAN_LIST_TARIFFS", "CAN_VIEW_TARIFFS"],
  CAN_DELETE_TARIFFS: ["CAN_LIST_TARIFFS", "CAN_VIEW_TARIFFS"],

  // Zones
  CAN_VIEW_ZONES: ["CAN_LIST_ZONES"],
  CAN_CREATE_ZONES: ["CAN_LIST_ZONES", "CAN_VIEW_ZONES"],
  CAN_EDIT_ZONES: ["CAN_LIST_ZONES", "CAN_VIEW_ZONES"],
  CAN_DELETE_ZONES: ["CAN_LIST_ZONES", "CAN_VIEW_ZONES"],

  // Settings
  CAN_EDIT_SETTINGS: ["CAN_VIEW_SETTINGS"],
};

/** Collect all permissions that depend on `permission` (reverse lookup) */
function getDependents(permission: Permission): Permission[] {
  const result: Permission[] = [];
  for (const [perm, deps] of Object.entries(PERMISSION_DEPS)) {
    if (deps?.includes(permission)) result.push(perm as Permission);
  }
  return result;
}

/** Add a permission plus all its transitive dependencies */
export function addWithDeps(current: Permission[], permission: Permission): Permission[] {
  const toAdd = new Set(current);
  toAdd.add(permission);
  for (const dep of PERMISSION_DEPS[permission] ?? []) {
    toAdd.add(dep);
  }
  return [...toAdd];
}

/** Remove a permission plus all permissions that depend on it (transitively) */
export function removeWithDependents(current: Permission[], permission: Permission): Permission[] {
  const toRemove = new Set<Permission>();
  const queue = [permission];
  while (queue.length > 0) {
    const p = queue.pop()!;
    if (toRemove.has(p)) continue;
    toRemove.add(p);
    for (const dep of getDependents(p)) {
      if (current.includes(dep)) queue.push(dep);
    }
  }
  return current.filter((p) => !toRemove.has(p));
}

/** Check if a permission is required by another selected permission */
export function isImplied(selected: Permission[], permission: Permission): boolean {
  return selected.some(
    (p) => p !== permission && (PERMISSION_DEPS[p]?.includes(permission) ?? false),
  );
}
