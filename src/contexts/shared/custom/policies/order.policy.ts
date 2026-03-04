import { hasAll, hasAny } from "./Policy";

export const orderPolicies = {
  // Partner
  listPartner: hasAll("CAN_LIST_PARTNER_ORDERS"),
  listAllPartner: hasAll("CAN_LIST_ALL_PARTNER_ORDERS"),
  viewPartner: hasAll("CAN_VIEW_PARTNER_ORDERS"),
  createPartner: hasAll("CAN_CREATE_PARTNER_ORDERS"),
  editPartner: hasAll("CAN_EDIT_PARTNER_ORDERS"),
  deletePartner: hasAll("CAN_DELETE_PARTNER_ORDERS"),

  // HQ
  listHQ: hasAll("CAN_LIST_HQ_ORDERS"),
  listAllHQ: hasAll("CAN_LIST_ALL_HQ_ORDERS"),
  viewHQ: hasAll("CAN_VIEW_HQ_ORDERS"),
  createHQ: hasAll("CAN_CREATE_HQ_ORDERS"),
  editHQ: hasAll("CAN_EDIT_HQ_ORDERS"),
  deleteHQ: hasAll("CAN_DELETE_HQ_ORDERS"),

  // Combinados: acceso si tiene permiso en partner O hq
  list: hasAny("CAN_LIST_PARTNER_ORDERS", "CAN_LIST_HQ_ORDERS"),
  view: hasAny("CAN_VIEW_PARTNER_ORDERS", "CAN_VIEW_HQ_ORDERS"),
  edit: hasAny("CAN_EDIT_PARTNER_ORDERS", "CAN_EDIT_HQ_ORDERS"),
  delete: hasAny("CAN_DELETE_PARTNER_ORDERS", "CAN_DELETE_HQ_ORDERS"),
};
