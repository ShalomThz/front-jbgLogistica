import { z } from "zod";
import { geolocationSchema } from "@contexts/shared/domain/schemas/address/Geolocation";

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
