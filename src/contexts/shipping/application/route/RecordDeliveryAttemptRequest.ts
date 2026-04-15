import { z } from "zod";
import { deliveryOutcomes } from "../../domain/schemas/route/DeliveryAttempt";

export const recordDeliveryAttemptRequestSchema = z.object({
  routeId: z.string().min(1),
  stopId: z.string().min(1),
  driverId: z.string().min(1),
  outcome: z.enum(deliveryOutcomes),
  reason: z.string().optional(),
  photo: z.string(),
  gpsLat: z.coerce.number(),
  gpsLng: z.coerce.number(),
  clientTimestamp: z.iso.datetime({ offset: true }),
});

export type RecordDeliveryAttemptRequest = z.infer<
  typeof recordDeliveryAttemptRequestSchema
>;