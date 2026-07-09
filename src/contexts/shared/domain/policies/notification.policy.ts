import { hasAll } from "./Policy";

export const notificationPolicies = {
  list: hasAll("CAN_LIST_NOTIFICATIONS"),
};
