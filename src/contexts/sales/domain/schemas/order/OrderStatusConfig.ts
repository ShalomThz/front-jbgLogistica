import type { OrderStatus } from "./Order";
import { orderStatuses } from "./OrderStatuses";

/**
 * El estatus de la orden habla del **cobro**, no del paquete: dice si JBG ya
 * pesó y tarifó, nada más. Dónde está el paquete lo dice el estatus del envío
 * (`SHIPMENT_STATUS_LABELS`), que es otra máquina y sigue corriendo mucho
 * después de que ésta se congela.
 *
 * De ahí los nombres: "Procesada" se lee como *un tramo terminado*, mientras
 * que "Completada" —como se llamaba— se leía como *todo terminado*, y dejaba
 * pares que parecían contradictorios ("Completada + En bodega").
 *
 * Los valores del enum no se tocan: el reporte cuenta ingresos filtrando por
 * `COMPLETED` y los filtros mandan el valor crudo.
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: "Borrador",
  PENDING_HQ_PROCESS: "Por procesar",
  COMPLETED: "Procesada",
  CANCELLED: "Cancelada",
};

/** Las opciones de los selectores de estatus, en el orden del ciclo. */
export const ORDER_STATUS_OPTIONS = orderStatuses.map((status) => ({
  value: status,
  label: ORDER_STATUS_LABELS[status],
}));

export const ORDER_STATUS_VARIANT: Record<
  OrderStatus,
  "secondary" | "default" | "outline" | "destructive"
> = {
  DRAFT: "secondary",
  PENDING_HQ_PROCESS: "outline",
  COMPLETED: "default",
  CANCELLED: "destructive",
};
