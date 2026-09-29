import { z } from "zod";
import { geolocationSchema } from "@contexts/shared/domain/schemas/address/Geolocation";
import {
  shipmentIncidentTypes,
  shipmentStages,
} from "@contexts/shipping/domain/schemas/shipment/ShipmentStages";

export const actorTypes = ["SYSTEM", "DRIVER", "ADMIN", "AGENT"] as const;

export type ActorType = (typeof actorTypes)[number];

/** Quién registró el evento, dicho como lo entiende quien lo lee. */
export const ACTOR_LABELS: Record<ActorType, string> = {
  SYSTEM: "Sistema",
  DRIVER: "Chofer",
  ADMIN: "JBG",
  AGENT: "Agente",
};

/** La bodega donde ocurrió: una dirección de Configuración, **copiada** al
 * registrar el evento. */
export const trackingLocationSchema = z.object({
  name: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
});

export type TrackingLocation = z.infer<typeof trackingLocationSchema>;

export const trackingIncidentSchema = z.object({
  type: z.enum(shipmentIncidentTypes),
  action: z.enum(["OPENED", "RESOLVED"]),
});

export type TrackingIncident = z.infer<typeof trackingIncidentSchema>;

/**
 * Una línea del historial, completa: con responsable, observaciones y
 * evidencia. Es la que ve el panel; el rastreo público recibe una versión
 * recortada (`TrackingTimelineResponse`).
 */
export const shipmentTrackingEventSchema = z.object({
  id: z.string(),
  shipmentId: z.string(),
  trackingNumber: z.string(),
  statusSnapshot: z.string(),
  // Los eventos anteriores a las etapas los traen en null.
  stage: z.enum(shipmentStages).nullable().default(null),
  eventCode: z.string().nullable().default(null),
  location: trackingLocationSchema.nullable().default(null),
  notes: z.string().nullable().default(null),
  incident: trackingIncidentSchema.nullable().default(null),
  description: z.string(),
  actorType: z.enum(actorTypes),
  actorId: z.string(),
  gpsLocation: geolocationSchema.nullable(),
  photoPath: z.string().nullable(),
  /** Todas las fotos del evento. El back la arma también para los eventos
   * viejos y los del conductor, así que es la única que hay que leer. */
  photoPaths: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  occurredAt: z.iso.datetime({ offset: true }),
});

export type ShipmentTrackingEventPrimitives = z.infer<
  typeof shipmentTrackingEventSchema
>;
