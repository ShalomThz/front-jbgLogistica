import { hasAll, hasAny } from "./Policy";

export const shippingPolicies = {
  manage: hasAll("CAN_LIST_SHIPMENTS"),
  list: hasAll("CAN_LIST_SHIPMENTS"),
  fulfill: hasAll("CAN_FULFILL_SHIPMENTS"),
  rates: hasAll("CAN_VIEW_SHIPMENT_RATES"),
  selectProvider: hasAll("CAN_SELECT_SHIPMENT_PROVIDER"),
  viewLabel: hasAll("CAN_VIEW_SHIPMENT_LABEL"),
  cancel: hasAll("CAN_CANCEL_SHIPMENTS"),
  recordEvents: hasAll("CAN_RECORD_SHIPMENT_EVENTS"),
  viewTracking: hasAny("CAN_LIST_SHIPMENTS", "CAN_RECORD_SHIPMENT_EVENTS"),

  // Routes
  listRoutes: hasAll("CAN_LIST_ROUTES"),
  viewRoutes: hasAll("CAN_VIEW_ROUTES"),
  createRoutes: hasAll("CAN_CREATE_ROUTES"),
  editRoutes: hasAll("CAN_EDIT_ROUTES"),
  cancelRoutes: hasAll("CAN_CANCEL_ROUTES"),
  deleteRoutes: hasAll("CAN_DELETE_ROUTES"),
  // Cross-store order pool for the route builder.
  listAllRouteOrders: hasAll("CAN_LIST_ALL_ROUTE_ORDERS"),

  // Drivers
  listDrivers: hasAll("CAN_LIST_DRIVERS"),
  // Buscar conductores: también quien crea/edita rutas o crea consolidados
  // (para asignarlos). Sólo protege `/driver/find`; la página de Conductores
  // sigue pidiendo `listDrivers`.
  findDrivers: hasAny(
    "CAN_LIST_DRIVERS",
    "CAN_CREATE_ROUTES",
    "CAN_EDIT_ROUTES",
    "CAN_CREATE_CONSOLIDATIONS",
  ),
  createDrivers: hasAll("CAN_CREATE_DRIVERS"),
  editDrivers: hasAll("CAN_EDIT_DRIVERS"),
};
