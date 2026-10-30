import { shipmentIncidentTypes } from "@contexts/shipping/domain/schemas/shipment/ShipmentStages";
import { shippingModes } from "@contexts/shipping/domain/schemas/shipment/ShippingModes";
import { trackingLocationSchema } from "@contexts/shipping/domain/schemas/tracking/ShipmentTrackingEvent";
import { z } from "zod";

/** Fotos por evento o incidencia. Espeja `MAX_EVIDENCE_PHOTOS` del back. */
export const MAX_EVIDENCE_PHOTOS = 10;

/**
 * Los opcionales van como `undefined`, nunca como `""`: el back rechaza el
 * vacío, así que el diálogo normaliza antes de armar la petición.
 */
export const recordShipmentEventRequestSchema = z.object({
  shipmentId: z.string().min(1),
  /** Al avanzar es opcional —un atajo para contar el paso con otro texto—; sin
   * avanzar es lo que se registra. */
  eventCode: z.string().min(1).optional(),
  /** Además de registrar, lleva al envío al paso que sigue. */
  advance: z.boolean().optional(),
  notes: z.string().trim().min(1).optional(),
  /** La bodega donde ocurrió: la copia de una dirección de Configuración, como
   * la manda la cotización de HQ. */
  location: trackingLocationSchema.optional(),
  recipientName: z.string().trim().min(1).optional(),
  transportMode: z.enum(shippingModes).optional(),
  consolidationRef: z.string().trim().min(1).optional(),
  photos: z.array(z.instanceof(Blob)).max(MAX_EVIDENCE_PHOTOS).optional(),
  signature: z.instanceof(Blob).optional(),
  /** Cuándo ocurrió, en ISO, si no fue ahora. */
  occurredAt: z.iso.datetime({ offset: true }).optional(),
});

export type RecordShipmentEventRequest = z.infer<
  typeof recordShipmentEventRequestSchema
>;

export const openShipmentIncidentRequestSchema = z.object({
  shipmentId: z.string().min(1),
  type: z.enum(shipmentIncidentTypes),
  reason: z.string().trim().min(1, "Escribe el motivo"),
  photos: z.array(z.instanceof(Blob)).max(MAX_EVIDENCE_PHOTOS).optional(),
  occurredAt: z.iso.datetime({ offset: true }).optional(),
});

export type OpenShipmentIncidentRequest = z.infer<
  typeof openShipmentIncidentRequestSchema
>;

export const resolveShipmentIncidentRequestSchema = z.object({
  shipmentId: z.string().min(1),
  resolution: z.string().trim().min(1, "Escribe cómo se resolvió"),
  occurredAt: z.iso.datetime({ offset: true }).optional(),
});

export type ResolveShipmentIncidentRequest = z.infer<
  typeof resolveShipmentIncidentRequestSchema
>;

/** Corrige la hora de un evento ya registrado. */
export const updateShipmentEventTimeRequestSchema = z.object({
  shipmentId: z.string().min(1),
  eventId: z.string().min(1),
  occurredAt: z.iso.datetime({ offset: true }),
});

export type UpdateShipmentEventTimeRequest = z.infer<
  typeof updateShipmentEventTimeRequestSchema
>;

/** El valor de un `<input type="datetime-local">`, en la hora local del
 * navegador, como lo pide el back. Vacío es "ahora": `undefined`. */
export const occurredAtFromInput = (value: string): string | undefined =>
  value ? new Date(value).toISOString() : undefined;

/** Al revés: una hora ISO como la espera un `datetime-local`, en hora local. */
export const occurredAtToInput = (iso: string): string => {
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};
