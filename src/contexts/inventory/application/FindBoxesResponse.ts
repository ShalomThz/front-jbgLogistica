import { z } from "zod";
import { boxSchema } from "@contexts/inventory/domain/schemas/box/Box";

const paginationSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});

export const findBoxesResponseSchema = z.object({
  data: z.array(boxSchema),
  pagination: paginationSchema,
});

export type FindBoxesResponsePrimitives = z.infer<typeof findBoxesResponseSchema>;
