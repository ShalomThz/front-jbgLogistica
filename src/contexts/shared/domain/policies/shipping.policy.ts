import { hasAll } from "./Policy";

export const shippingPolicies = {
  manage: hasAll("CAN_LIST_SHIPMENTS"),
  list: hasAll("CAN_LIST_SHIPMENTS"),
  fulfill: hasAll("CAN_FULFILL_SHIPMENTS"),
  rates: hasAll("CAN_VIEW_SHIPMENT_RATES"),
  selectProvider: hasAll("CAN_SELECT_SHIPMENT_PROVIDER"),
  viewLabel: hasAll("CAN_VIEW_SHIPMENT_LABEL"),
  cancel: hasAll("CAN_CANCEL_SHIPMENTS"),
};
