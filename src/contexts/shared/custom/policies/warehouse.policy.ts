import { allOf, hasAll, isUserType } from "./Policy";

export const warehousePolicies = {
  manage: hasAll("CAN_LIST_PACKAGES"),
  list: hasAll("CAN_LIST_PACKAGES"),
  view: hasAll("CAN_VIEW_PACKAGES"),
  viewReceipt: hasAll("CAN_VIEW_PACKAGE_RECEIPT"),
  create: hasAll("CAN_CREATE_PACKAGES"),
  edit: hasAll("CAN_EDIT_PACKAGES"),
  delete: hasAll("CAN_DELETE_PACKAGES"),
  customerView: allOf(hasAll("CAN_VIEW_OWN_PACKAGES"), isUserType("CUSTOMER")),
};
