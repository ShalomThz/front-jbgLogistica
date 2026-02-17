import { orderSchema } from "@contexts/sales/domain/schemas/order/Order";
import { paginationSchema } from "@contexts/shared/domain/schemas/Pagination";
import { z } from "zod";

export const findOrdersResponseSchema = z.object({
  data: z.array(orderSchema),
  pagination: paginationSchema,
});

export type FindOrdersResponse = z.infer<typeof findOrdersResponseSchema>;
