import { hasAll } from "./Policy";

export const notificationPolicies = {
  list: hasAll("CAN_LIST_NOTIFICATIONS"),
  listAll: hasAll("CAN_LIST_ALL_NOTIFICATIONS"),
};
