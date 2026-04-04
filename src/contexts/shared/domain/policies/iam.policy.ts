import { hasAll, hasAny } from "./Policy";

export const iamPolicies = {
  manageUsers: hasAll("CAN_LIST_USERS"),
  listUsers: hasAll("CAN_LIST_USERS"),
  viewUser: hasAll("CAN_VIEW_USERS"),
  createUser: hasAll("CAN_CREATE_USERS"),
  editUser: hasAll("CAN_EDIT_USERS"),
  deleteUser: hasAll("CAN_DELETE_USERS"),

  manageStores: hasAll("CAN_LIST_STORES"),
  listStores: hasAny("CAN_LIST_STORES", "CAN_CREATE_HQ_ORDERS"),
  viewStore: hasAny("CAN_VIEW_STORES", "CAN_CREATE_HQ_ORDERS"),
  createStore: hasAll("CAN_CREATE_STORES"),
  editStore: hasAll("CAN_EDIT_STORES"),
  deleteStore: hasAll("CAN_DELETE_STORES"),
};
