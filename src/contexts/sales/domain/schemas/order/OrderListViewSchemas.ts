import { z } from "zod";
import { orderSchema } from "./Order";
import { storeSchema } from "@contexts/iam/domain/schemas/store/Store";
import { shipmentSchema } from "@contexts/shipping/domain/schemas/shipment/Shipment";

export const orderListViewSchema = orderSchema.omit({ storeId: true }).extend({
  store: storeSchema,
  shipment: shipmentSchema.nullable(),
  invoiceUrl: z.string().nullable(),
});

export type OrderListView = z.infer<typeof orderListViewSchema>;
