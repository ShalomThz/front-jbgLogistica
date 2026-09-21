import { z } from "zod";
import { orderSchema } from "./Order";
import { storeSchema } from "@contexts/iam/domain/schemas/store/Store";
import { userRefSchema } from "@contexts/iam/domain/schemas/user/User";
import { shipmentSchema } from "@contexts/shipping/domain/schemas/shipment/Shipment";

export const orderListViewSchema = orderSchema
  .omit({ storeId: true, createdBy: true })
  .extend({
    // Identidad de la tienda, no la tienda entera: es lo que el backend
    // embebe en la orden. La zona con la que se cotizó vive en
    // `pricing.zoneId`.
    store: storeSchema.pick({
      id: true,
      name: true,
      contactEmail: true,
    }),
    createdBy: userRefSchema,
    shipment: shipmentSchema.nullable(),
  });

export type OrderListView = z.infer<typeof orderListViewSchema>;
