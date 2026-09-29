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
  eventCode: z.string().min(1),
  notes: z.string().trim().min(1).optional(),
  /** La bodega donde ocurrió: la copia de una dirección de Configuración, como
   * la manda la cotización de HQ. */
  location: trackingLocationSchema.optional(),
  recipientName: z.string().trim().min(1).optional(),
  transportMode: z.enum(shippingModes).optional(),
  consolidationRef: z.string().trim().min(1).optional(),
  photos: z.array(z.instanceof(Blob)).max(MAX_EVIDENCE_PHOTOS).optional(),
  signature: z.instanceof(Blob).optional(),
});

export type RecordShipmentEventRequest = z.infer<
  typeof recordShipmentEventRequestSchema
>;

export const openShipmentIncidentRequestSchema = z.object({
  shipmentId: z.string().min(1),
  type: z.enum(shipmentIncidentTypes),
  reason: z.string().trim().min(1, "Escribe el motivo"),
  photos: z.array(z.instanceof(Blob)).max(MAX_EVIDENCE_PHOTOS).optional(),
});

export type OpenShipmentIncidentRequest = z.infer<
  typeof openShipmentIncidentRequestSchema
>;

export const resolveShipmentIncidentRequestSchema = z.object({
  shipmentId: z.string().min(1),
  resolution: z.string().trim().min(1, "Escribe cómo se resolvió"),
});

export type ResolveShipmentIncidentRequest = z.infer<
  typeof resolveShipmentIncidentRequestSchema
>;
