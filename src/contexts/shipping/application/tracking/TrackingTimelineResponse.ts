import {
  shipmentIncidentTypes,
  shipmentStages,
} from "@contexts/shipping/domain/schemas/shipment/ShipmentStages";
import {
  actorTypes,
  trackingIncidentSchema,
} from "@contexts/shipping/domain/schemas/tracking/ShipmentTrackingEvent";
import { carrierSchema } from "@contexts/shipping/domain/schemas/value-objects/Carrier";
import { parcelSchema } from "@contexts/shipping/domain/schemas/value-objects/Parcel";
import { z } from "zod";

/** Lo que el rastreo público recibe de cada evento: sin responsable, sin GPS,
 * sin archivos y sin observaciones internas. */
export const publicTrackingEventSchema = z.object({
  id: z.string(),
  occurredAt: z.iso.datetime({ offset: true }),
  stage: z.enum(shipmentStages).nullable(),
  description: z.string(),
  location: z
    .object({ name: z.string(), city: z.string(), state: z.string() })
    .nullable(),
  actorType: z.enum(actorTypes),
  incident: trackingIncidentSchema.nullable(),
});

export type PublicTrackingEvent = z.infer<typeof publicTrackingEventSchema>;

export const trackingSummarySchema = z.object({
  trackingNumber: z.string(),
  orderNumber: z.string().nullable(),
  status: z.string(),
  stage: z.enum(shipmentStages).nullable(),
  incident: z.enum(shipmentIncidentTypes).nullable(),
  carrier: carrierSchema.nullable(),
  parcel: parcelSchema.nullable(),
  origin: z.object({ city: z.string(), province: z.string() }),
  destination: z.object({
    name: z.string(),
    city: z.string(),
    province: z.string(),
  }),
});

export type TrackingSummary = z.infer<typeof trackingSummarySchema>;

export const trackingTimelineResponseSchema = z.object({
  events: z.array(publicTrackingEventSchema),
  summary: trackingSummarySchema.nullable(),
});

export type TrackingTimelineResponse = z.infer<
  typeof trackingTimelineResponseSchema
>;
