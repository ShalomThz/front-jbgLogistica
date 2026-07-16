import { z } from "zod";
import { geolocationSchema } from "@contexts/shared/domain/schemas/address/Geolocation";
import { carrierSchema } from "@contexts/shipping/domain/schemas/value-objects/Carrier";
import { parcelSchema } from "@contexts/shipping/domain/schemas/value-objects/Parcel";

const actorTypes = ["SYSTEM", "DRIVER", "ADMIN"] as const;

export const shipmentTrackingEventSchema = z.object({
  id: z.string(),
  shipmentId: z.string(),
  trackingNumber: z.string(),
  statusSnapshot: z.string(),
  description: z.string(),
  actorType: z.enum(actorTypes),
  actorId: z.string(),
  gpsLocation: geolocationSchema.nullable(),
  photoPath: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  occurredAt: z.iso.datetime({ offset: true }),
});

export type ActorType = z.infer<typeof shipmentTrackingEventSchema.shape.actorType>;
export type ShipmentTrackingEventPrimitives = z.infer<
  typeof shipmentTrackingEventSchema
>;

export const trackingSummarySchema = z.object({
  trackingNumber: z.string(),
  orderNumber: z.string().nullable(),
  status: z.string(),
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
  events: z.array(shipmentTrackingEventSchema),
  summary: trackingSummarySchema.nullable(),
});

export type TrackingTimelineResponse = z.infer<
  typeof trackingTimelineResponseSchema
>;
