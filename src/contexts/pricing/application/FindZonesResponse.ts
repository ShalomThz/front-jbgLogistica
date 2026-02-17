import { z } from "zod";
import { zoneSchema } from "@contexts/pricing/domain/schemas/zone/Zone";

const paginationSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});

export const findZonesResponseSchema = z.object({
  data: z.array(zoneSchema),
  pagination: paginationSchema,
});

export type FindZonesResponsePrimitives = z.infer<typeof findZonesResponseSchema>;
