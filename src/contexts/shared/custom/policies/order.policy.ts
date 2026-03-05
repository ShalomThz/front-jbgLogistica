import { hasAll, hasAny } from "./Policy";

export const orderPolicies = {
  // List (unificado)
  list: hasAll("CAN_LIST_ORDERS"),
  listAll: hasAll("CAN_LIST_ALL_ORDERS"),

  // Partner
  viewPartner: hasAll("CAN_VIEW_PARTNER_ORDERS"),
  createPartner: hasAll("CAN_CREATE_PARTNER_ORDERS"),
  editPartner: hasAll("CAN_EDIT_PARTNER_ORDERS"),
  deletePartner: hasAll("CAN_DELETE_PARTNER_ORDERS"),

  // HQ
  viewHQ: hasAll("CAN_VIEW_HQ_ORDERS"),
  createHQ: hasAll("CAN_CREATE_HQ_ORDERS"),
  editHQ: hasAll("CAN_EDIT_HQ_ORDERS"),
  deleteHQ: hasAll("CAN_DELETE_HQ_ORDERS"),

  // Combinados (acceso si tiene permiso en partner O hq)
  view: hasAny("CAN_VIEW_PARTNER_ORDERS", "CAN_VIEW_HQ_ORDERS"),
  edit: hasAny("CAN_EDIT_PARTNER_ORDERS", "CAN_EDIT_HQ_ORDERS"),
  delete: hasAny("CAN_DELETE_PARTNER_ORDERS", "CAN_DELETE_HQ_ORDERS"),
};
