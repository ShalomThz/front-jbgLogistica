import { z } from "zod";
import { boxSaleSchema } from "@contexts/inventory/domain/schemas/boxSale/BoxSale";

const paginationSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});

export const findBoxSalesResponseSchema = z.object({
  data: z.array(boxSaleSchema),
  pagination: paginationSchema,
});

export type FindBoxSalesResponsePrimitives = z.infer<typeof findBoxSalesResponseSchema>;
