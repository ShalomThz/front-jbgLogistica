import { hasAll } from "./Policy";

export const settingsPolicies = {
  manage: hasAll("CAN_VIEW_SETTINGS"),
  view: hasAll("CAN_VIEW_SETTINGS"),
  edit: hasAll("CAN_EDIT_SETTINGS"),
};
