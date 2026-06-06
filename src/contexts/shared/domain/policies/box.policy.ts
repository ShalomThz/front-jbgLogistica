import { hasAll, hasAny } from "./Policy";

export const boxPolicies = {
  manage: hasAll("CAN_LIST_BOXES"),
  // Los creadores de órdenes pueden consultar cajas para el selector del paso de paquete,
  // sin necesitar el permiso de cajas.
  list: hasAny("CAN_LIST_BOXES", "CAN_CREATE_PARTNER_ORDERS", "CAN_CREATE_HQ_ORDERS"),
  view: hasAll("CAN_VIEW_BOXES"),
  create: hasAll("CAN_CREATE_BOXES"),
  edit: hasAll("CAN_EDIT_BOXES"),
  delete: hasAll("CAN_DELETE_BOXES"),
  sell: hasAll("CAN_SELL_BOXES"),
  listSales: hasAll("CAN_LIST_BOX_SALES"),
  listSalesAll: hasAll("CAN_LIST_ALL_BOX_SALES"),
};
