import { hasAll } from "./Policy";

export const customerPolicies = {
  manage: hasAll("CAN_LIST_CUSTOMERS"),
  list: hasAll("CAN_LIST_CUSTOMERS"),
  listAll: hasAll("CAN_LIST_ALL_CUSTOMERS"),
  view: hasAll("CAN_VIEW_CUSTOMERS"),
  create: hasAll("CAN_CREATE_CUSTOMERS"),
  edit: hasAll("CAN_EDIT_CUSTOMERS"),
  delete: hasAll("CAN_DELETE_CUSTOMERS"),
  provisionAccess: hasAll("CAN_PROVISION_CUSTOMER_ACCESS"),
};
