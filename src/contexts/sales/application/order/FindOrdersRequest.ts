import { orderSchema } from "@contexts/sales/domain/schemas/order/Order";
import { createCriteriaSchema } from "@contexts/shared/domain/services/CreateCriteriaSchema";
import type z from "zod";

export const findOrdersRequestSchema = createCriteriaSchema(orderSchema);

export type FindOrdersRequest = z.infer<typeof findOrdersRequestSchema>;
