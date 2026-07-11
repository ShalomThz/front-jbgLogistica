import { hasAll, hasAny } from "./Policy";

export const pricingPolicies = {
  manageTariffs: hasAll("CAN_LIST_TARIFFS"),
  // Quien crea órdenes partner necesita leer las tarifas de su zona: las cajas
  // disponibles en la orden se derivan de ellas (useZoneBoxes).
  listTariffs: hasAny("CAN_LIST_TARIFFS", "CAN_CREATE_PARTNER_ORDERS"),
  viewTariff: hasAll("CAN_VIEW_TARIFFS"),
  createTariff: hasAll("CAN_CREATE_TARIFFS"),
  editTariff: hasAll("CAN_EDIT_TARIFFS"),
  deleteTariff: hasAll("CAN_DELETE_TARIFFS"),

  manageZones: hasAll("CAN_LIST_ZONES"),
  // Quien puede cambiar la zona de tarifas en una orden necesita listar las
  // zonas para elegirla, aunque no administre el catálogo.
  listZones: hasAny("CAN_LIST_ZONES", "CAN_CHANGE_ORDER_ZONE"),
  viewZone: hasAll("CAN_VIEW_ZONES"),
  createZone: hasAll("CAN_CREATE_ZONES"),
  editZone: hasAll("CAN_EDIT_ZONES"),
  deleteZone: hasAll("CAN_DELETE_ZONES"),

  viewTariffReports: hasAll("CAN_VIEW_TARIFF_REPORTS"),
  viewZoneReports: hasAll("CAN_VIEW_ZONE_REPORTS"),
};
