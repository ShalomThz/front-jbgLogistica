import { hasAll } from "./Policy";

export const pricingPolicies = {
  manageTariffs: hasAll("CAN_LIST_TARIFFS"),
  listTariffs: hasAll("CAN_LIST_TARIFFS"),
  viewTariff: hasAll("CAN_VIEW_TARIFFS"),
  createTariff: hasAll("CAN_CREATE_TARIFFS"),
  editTariff: hasAll("CAN_EDIT_TARIFFS"),
  deleteTariff: hasAll("CAN_DELETE_TARIFFS"),

  manageZones: hasAll("CAN_LIST_ZONES"),
  listZones: hasAll("CAN_LIST_ZONES"),
  viewZone: hasAll("CAN_VIEW_ZONES"),
  createZone: hasAll("CAN_CREATE_ZONES"),
  editZone: hasAll("CAN_EDIT_ZONES"),
  deleteZone: hasAll("CAN_DELETE_ZONES"),
};
