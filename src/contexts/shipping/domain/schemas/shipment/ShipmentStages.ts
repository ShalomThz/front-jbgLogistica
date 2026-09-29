import type { StatusTone } from "@contexts/shared/domain/schemas/StatusTone";

/**
 * Las ocho etapas que ve el cliente, en orden (guía operativa de rastreo, §1).
 * Espeja `shipmentStages` del back.
 *
 * Conviven con `ShipmentStatus`, que sigue siendo el operativo: dice qué falta
 * hacer ("por recolectar a domicilio", "generando guía"). La etapa dice dónde
 * está el paquete, que es lo que entiende el cliente.
 */
export const shipmentStages = [
  "AGENT",
  "ORIGIN_WAREHOUSE",
  "DISPATCHED",
  "IN_TRANSIT",
  "DESTINATION_WAREHOUSE",
  "DISTRIBUTION",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

export type ShipmentStage = (typeof shipmentStages)[number];

export const stageIndex = (stage: ShipmentStage): number =>
  shipmentStages.indexOf(stage);

/** El nombre de cada etapa, como lo escribe la guía del cliente. */
export const STAGE_LABELS: Record<ShipmentStage, string> = {
  AGENT: "Agente",
  ORIGIN_WAREHOUSE: "Bodega origen",
  DISPATCHED: "Despachado",
  IN_TRANSIT: "En tránsito",
  DESTINATION_WAREHOUSE: "Bodega destino",
  DISTRIBUTION: "Distribución",
  OUT_FOR_DELIVERY: "En ruta",
  DELIVERED: "Entregado",
};

/**
 * El color de una etapa. Lo del agente va siempre en ámbar —es su color, el de
 * "atención"—, aunque la orden ya esté en tránsito o entregada; el resto toma
 * el tono de la orden. Un corte o una incidencia (rojo) gana también sobre el
 * agente: el problema tiene que verse.
 */
export const toneForStage = (
  stage: ShipmentStage | null,
  orderTone: StatusTone,
): StatusTone =>
  stage === "AGENT" && orderTone !== "stopped" ? AGENT_TONE : orderTone;

/** El color de todo lo del agente: su etapa, sus eventos, su nombre. */
export const AGENT_TONE: StatusTone = "waiting";

/** La segunda línea de cada paso en la línea de tiempo. */
export const STAGE_CAPTIONS: Record<ShipmentStage, string> = {
  AGENT: "Inicio del envío",
  ORIGIN_WAREHOUSE: "Los Ángeles, CA",
  DISPATCHED: "Salida internacional",
  IN_TRANSIT: "Internacional",
  DESTINATION_WAREHOUSE: "México",
  DISTRIBUTION: "Preparación de entrega",
  OUT_FOR_DELIVERY: "Último tramo",
  DELIVERED: "Confirmación final",
};

/**
 * Los estados especiales (guía, §2). Espeja `shipmentIncidentTypes` del back.
 * Son una capa encima del recorrido: no lo mueven, y al resolverse sigue desde
 * donde estaba.
 */
export const shipmentIncidentTypes = [
  "GENERAL",
  "HELD",
  "PENDING_DOCUMENTATION",
  "WRONG_ADDRESS",
  "RECIPIENT_ABSENT",
  "DAMAGE_REPORTED",
  "RETURNED_TO_WAREHOUSE",
  "OTHER",
] as const;

export type ShipmentIncidentType = (typeof shipmentIncidentTypes)[number];

export const INCIDENT_LABELS: Record<ShipmentIncidentType, string> = {
  GENERAL: "Incidencia general",
  HELD: "Retenido",
  PENDING_DOCUMENTATION: "Pendiente de documentación",
  WRONG_ADDRESS: "Dirección incorrecta",
  RECIPIENT_ABSENT: "Destinatario ausente",
  DAMAGE_REPORTED: "Daño reportado",
  RETURNED_TO_WAREHOUSE: "Devuelto a bodega",
  OTHER: "Otra incidencia",
};
