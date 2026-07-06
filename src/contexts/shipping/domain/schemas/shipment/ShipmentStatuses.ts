export const shipmentStatuses = [
  "DRAFT",
  // Ciclo de caja vacía ("dejar caja vacía a domicilio"), antes de fulfil
  "EMPTY_BOX_PENDING",
  "AWAITING_PICKUP",
  "AT_WAREHOUSE",
  "PROVIDER_SELECTED",
  "FULFILLED",
  "IN_ROUTE",
  "DELIVERED",
  "FAILED_ATTEMPT",
  "RETURNED",
  "CANCELLED",
] as const;

/** Etiquetas para los estados del ciclo de caja vacía, mostradas como badge
 * junto al estatus de la orden mientras la caja avanza. */
export const BOX_CYCLE_STATUS_LABELS: Partial<
  Record<(typeof shipmentStatuses)[number], string>
> = {
  EMPTY_BOX_PENDING: "Caja vacía por entregar",
  AWAITING_PICKUP: "Pendiente de recolección",
  AT_WAREHOUSE: "En bodega",
};
