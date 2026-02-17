import { z } from "zod";
import { addressSchema } from "@contexts/shared/domain/schemas/address/Address";

export const routeStopSchema = z.object({
  id: z.string(),
  stopOrder: z.number().int().positive(),
  orderId: z.string(),
  address: addressSchema,
  isCompleted: z.boolean(),
});

export type RouteStopPrimitives = z.infer<typeof routeStopSchema>;
