import { z } from "zod";
import { orderSchema } from "./Order";

const paginationSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});

export const findOrdersResponseSchema = z.object({
  data: z.array(orderSchema),
  pagination: paginationSchema,
});

export type FindOrdersResponsePrimitives = z.infer<typeof findOrdersResponseSchema>;
