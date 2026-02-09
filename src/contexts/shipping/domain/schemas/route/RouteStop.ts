import { z } from "zod";
import { addressSchema } from "@/shared/domain";
export const routeStopSchema = z.object({
  id: z.string(),
  stopOrder: z.number().int().positive(),
  orderId: z.string(),
  address: addressSchema,
  isCompleted: z.boolean(),
});

export type RouteStopPrimitives = z.infer<typeof routeStopSchema>;