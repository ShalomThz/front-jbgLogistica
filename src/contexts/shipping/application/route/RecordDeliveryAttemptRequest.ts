import { z } from "zod";
import { deliveryAttemptSchema } from "../../domain/schemas/route/DeliveryAttempt";

export const recordDeliveryAttemptRequestSchema = z.object({
  routeId: z.string().uuid(),
  stopId: z.string().uuid(),
  outcome: deliveryAttemptSchema.shape.outcome,
  photo: z.instanceof(File),
  gpsLat: z.number(),
  gpsLng: z.number(),
  clientTimestamp: z.string().datetime({ offset: true }),
  reason: z.string().optional(),
});

export type RecordDeliveryAttemptRequest = z.infer<
  typeof recordDeliveryAttemptRequestSchema
>;
