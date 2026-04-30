import { z } from "zod";
import { boxSaleListViewSchema } from "@contexts/inventory/domain/schemas/boxSale/BoxSaleListView";

const paginationSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});

export const findBoxSalesResponseSchema = z.object({
  data: z.array(boxSaleListViewSchema),
  pagination: paginationSchema,
});

export type FindBoxSalesResponsePrimitives = z.infer<typeof findBoxSalesResponseSchema>;
