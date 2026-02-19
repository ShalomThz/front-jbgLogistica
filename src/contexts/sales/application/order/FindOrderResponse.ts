import { orderListViewSchema } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import { paginationSchema } from "@contexts/shared/domain/schemas/Pagination";
import { z } from "zod";

export const findOrdersResponseSchema = z.object({
  data: z.array(orderListViewSchema),
  pagination: paginationSchema,
});

export type FindOrdersResponse = z.infer<typeof findOrdersResponseSchema>;
