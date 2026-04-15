import { z } from "zod";
import { geolocationSchema } from "@contexts/shared/domain/schemas/address/Geolocation";

export const deliveryOutcomes = ["DELIVERED", "FAILED"] as const;

export const deliveryAttemptSchema = z.object({
  attemptNumber: z.number().int().min(1),
  outcome: z.enum(deliveryOutcomes),
  reason: z.string().nullable(),
  photoPath: z.string().min(1, "Photo evidence is required for every attempt"),
  gpsLocation: geolocationSchema,
  driverId: z.string(),
  clientTimestamp: z.iso.datetime({ offset: true }),
  serverTimestamp: z.iso.datetime({ offset: true }),
});

export type DeliveryOutcome = z.infer<
  typeof deliveryAttemptSchema.shape.outcome
>;
export type DeliveryAttemptPrimitives = z.infer<typeof deliveryAttemptSchema>;
