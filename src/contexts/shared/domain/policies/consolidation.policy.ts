import { hasAll } from "./Policy";

export const consolidationPolicies = {
  list: hasAll("CAN_LIST_CONSOLIDATIONS"),
  view: hasAll("CAN_VIEW_CONSOLIDATIONS"),
  create: hasAll("CAN_CREATE_CONSOLIDATIONS"),
  edit: hasAll("CAN_EDIT_CONSOLIDATIONS"),
  delete: hasAll("CAN_DELETE_CONSOLIDATIONS"),
  managePackages: hasAll("CAN_MANAGE_CONSOLIDATION_PACKAGES"),
  advanceStage: hasAll("CAN_ADVANCE_CONSOLIDATION_STAGE"),

  // Catálogo de tráilers
  listTrailers: hasAll("CAN_LIST_TRAILERS"),
  createTrailers: hasAll("CAN_CREATE_TRAILERS"),
  editTrailers: hasAll("CAN_EDIT_TRAILERS"),
};
