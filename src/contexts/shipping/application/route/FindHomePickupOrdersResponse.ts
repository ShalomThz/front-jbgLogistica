import { orderListViewSchema } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import { z } from "zod";

/** Orders "aplica recolección a domicilio" pendientes de recolectar (flota JBG). */
export const findHomePickupOrdersResponseSchema = z.object({
  data: z.array(orderListViewSchema),
});

export type FindHomePickupOrdersResponse = z.infer<
  typeof findHomePickupOrdersResponseSchema
>;
