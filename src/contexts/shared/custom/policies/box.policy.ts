import { hasAll } from "./Policy";

export const boxPolicies = {
  manage: hasAll("CAN_LIST_BOXES"),
  list: hasAll("CAN_LIST_BOXES"),
  view: hasAll("CAN_VIEW_BOXES"),
  create: hasAll("CAN_CREATE_BOXES"),
  edit: hasAll("CAN_EDIT_BOXES"),
  delete: hasAll("CAN_DELETE_BOXES"),
  sell: hasAll("CAN_SELL_BOXES"),
  listSales: hasAll("CAN_LIST_BOX_SALES"),
};
