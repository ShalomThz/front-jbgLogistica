import { z } from "zod";
import { addressSchema } from "@contexts/shared/domain/schemas/address/Address";
import { deliveryAttemptSchema } from "./DeliveryAttempt";

const routeStopStatuses = [
  "PENDING",
  "DELIVERED",
  "FAILED",
  "RETURNED",
] as const;

export const routeStopSchema = z.object({
  id: z.string(),
  stopOrder: z.number().int().positive(),
  shipmentId: z.string(),
  address: addressSchema,
  status: z.enum(routeStopStatuses),
  attempts: z.array(deliveryAttemptSchema),
});

export type RouteStopStatus = z.infer<typeof routeStopSchema.shape.status>;
export type RouteStopPrimitives = z.infer<typeof routeStopSchema>;
