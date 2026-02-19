import { orderListViewSchema } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import { createCriteriaSchema } from "@contexts/shared/domain/services/CreateCriteriaSchema";
import type z from "zod";

export const findOrdersRequestSchema = createCriteriaSchema(orderListViewSchema);

export type FindOrdersRequest = z.infer<typeof findOrdersRequestSchema>;
