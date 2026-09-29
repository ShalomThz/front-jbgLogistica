import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import { ORDER_STATUS_LABELS } from "@contexts/sales/domain/schemas/order/OrderStatusConfig";
import type { StatusTone } from "@contexts/shared/domain/schemas/StatusTone";
import type { ShipmentIncidentPrimitives } from "@contexts/shipping/domain/schemas/shipment/Shipment";
import {
  INCIDENT_LABELS,
  shipmentStages,
  STAGE_LABELS,
  stageIndex,
  type ShipmentStage,
} from "@contexts/shipping/domain/schemas/shipment/ShipmentStages";
import {
  SHIPMENT_STATUS_LABELS,
  SHIPMENT_STATUS_TONE,
  type ShipmentStatus,
} from "@contexts/shipping/domain/schemas/shipment/ShipmentStatuses";
import {
  timelineStages,
  type TimelineFlags,
} from "@contexts/shipping/domain/services/timelineStages";

/**
 * Los tramos de la barra de la tabla: las ocho etapas de la guía, siempre las
 * ocho. A diferencia de la línea del detalle, que omite las que no aplican, en
 * una columna las filas se comparan entre sí, y una cantidad variable de tramos
 * haría que dos dibujos iguales signifiquen cosas distintas.
 */
export const ORDER_MILESTONES = shipmentStages.map((stage) => STAGE_LABELS[stage]);

export interface OrderProgress {
  /** Etapas alcanzadas, de 0 (no arrancó) a `ORDER_MILESTONES.length`. */
  reached: number;
  stage: ShipmentStage | null;
  /** Dónde está: la etapa, o el corte si el recorrido se cortó. */
  label: string;
  /** Qué falta, en el vocabulario operativo ("Por procesar", "Generando
   * guía"). Vacío cuando no agrega nada a la etiqueta. */
  detail: string;
  /** Qué falta para avanzar, en una frase. Vacío cuando no falta nada. */
  hint: string;
  /** De quién es la pelota; una incidencia abierta lo vuelve problema. */
  tone: StatusTone;
  incident: ShipmentIncidentPrimitives | null;
}

/** Qué falta para que cada estatus avance, y quién lo debe. */
const HINT_BY_SHIPMENT_STATUS: Record<ShipmentStatus, string> = {
  DRAFT: "Falta terminar de capturarla",
  EMPTY_BOX_PENDING: "El chofer debe llevarle la caja vacía al remitente",
  AWAITING_PICKUP: "La caja está con el cliente; el chofer debe recolectarla",
  AWAITING_AGENCY_PICKUP:
    "El paquete está en la agencia; el chofer debe pasar a buscarlo",
  AT_WAREHOUSE: "JBG debe pesarla y tarifarla",
  PROVIDER_SELECTED: "La paquetería está emitiendo la guía",
  FULFILLED: "Lista para salir de la bodega de origen",
  IN_ROUTE: "El paquete va camino al destinatario",
  FAILED_ATTEMPT: "Se volverá a intentar la entrega",
  DELIVERED: "",
  RETURNED: "Se agotaron los intentos de entrega",
  CANCELLED: "",
};

/**
 * Con guía y ya fuera de la bodega de origen, el estatus sigue en `FULFILLED`
 * durante todo el tramo internacional: lo que falta lo dice la etapa.
 */
const HINT_BY_STAGE_IN_TRANSIT: Partial<Record<ShipmentStage, string>> = {
  DISPATCHED: "Salió de la bodega de origen",
  IN_TRANSIT: "En camino a la bodega de destino",
  DESTINATION_WAREHOUSE: "En la bodega de destino",
  DISTRIBUTION: "Falta asignarla a una ruta de reparto",
};

/**
 * El estatus operativo como segunda línea, solo cuando agrega algo. "En ruta"
 * bajo "En ruta" o "Entregada" bajo "Entregado" repiten; y "Por despachar"
 * deja de ser cierto en cuanto el paquete salió de origen, aunque el estatus
 * siga en `FULFILLED`.
 */
function operationalDetail(
  status: ShipmentStatus,
  stage: ShipmentStage,
): string {
  if (status === "IN_ROUTE" || status === "DELIVERED") return "";
  if (status === "FULFILLED" && stage !== "ORIGIN_WAREHOUSE") return "";
  return SHIPMENT_STATUS_LABELS[status];
}

/** Las banderas de la línea de tiempo, a partir de la orden. */
export function timelineFlagsOf(order: OrderListView): TimelineFlags {
  return {
    hasAgentStage:
      order.type === "PARTNER" || order.emptyBoxDelivery || order.homePickup,
    viaCarrier: order.shipment?.provider?.type === "THIRD_PARTY",
  };
}

/** Las etapas que la línea del detalle muestra para esta orden. */
export function orderTimelineStages(
  order: OrderListView,
): readonly ShipmentStage[] {
  return timelineStages(timelineFlagsOf(order), order.shipment?.stage ?? null);
}

const CUT: Omit<OrderProgress, "reached" | "stage" | "label"> = {
  detail: "",
  hint: "",
  tone: "stopped",
  incident: null,
};

/**
 * El estado de una orden como una sola cosa: **dónde está** (la etapa que ve el
 * cliente), **qué falta** (el estatus operativo) y **de quién es la pelota**
 * (el tono). Lo leen la fila, la barra, el encabezado del detalle y la línea
 * de tiempo, así que la misma orden dice lo mismo en todas.
 */
export function orderProgress(order: OrderListView): OrderProgress {
  const shipment = order.shipment;
  const stage = shipment?.stage ?? null;
  const reached = stage ? stageIndex(stage) + 1 : 0;

  // Los cortes ganan sobre cualquier avance: el recorrido ya no sigue.
  if (order.status === "CANCELLED" || shipment?.status === "CANCELLED") {
    return { ...CUT, reached, stage, label: "Cancelada" };
  }
  if (shipment?.status === "RETURNED") {
    return {
      ...CUT,
      reached,
      stage,
      label: SHIPMENT_STATUS_LABELS.RETURNED,
      hint: HINT_BY_SHIPMENT_STATUS.RETURNED,
    };
  }

  // Todavía no arrancó: el estatus de la orden dice si la está capturando el
  // mostrador o si el agente ya la terminó y espera a JBG.
  if (!shipment || !stage) {
    const waitingForJbg = order.status === "PENDING_HQ_PROCESS";
    return {
      reached: 0,
      stage: null,
      label: waitingForJbg
        ? ORDER_STATUS_LABELS.PENDING_HQ_PROCESS
        : SHIPMENT_STATUS_LABELS.DRAFT,
      detail: "",
      hint: waitingForJbg
        ? HINT_BY_SHIPMENT_STATUS.AT_WAREHOUSE
        : HINT_BY_SHIPMENT_STATUS.DRAFT,
      tone: waitingForJbg ? "waiting" : "draft",
      incident: null,
    };
  }

  const { status, incident } = shipment;
  const hint =
    (status === "FULFILLED" && HINT_BY_STAGE_IN_TRANSIT[stage]) ||
    HINT_BY_SHIPMENT_STATUS[status];

  return {
    reached,
    stage,
    label: STAGE_LABELS[stage],
    detail: operationalDetail(status, stage),
    hint: incident
      ? `${INCIDENT_LABELS[incident.type]}: ${incident.reason}`
      : hint,
    tone: incident ? "stopped" : SHIPMENT_STATUS_TONE[status],
    incident,
  };
}
