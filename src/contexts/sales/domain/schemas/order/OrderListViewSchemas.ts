import { z } from "zod";
import { orderSchema } from "./Order";
import { storeSchema } from "@contexts/iam/domain/schemas/store/Store";
import { userRefSchema } from "@contexts/iam/domain/schemas/user/User";
import { shipmentSchema } from "@contexts/shipping/domain/schemas/shipment/Shipment";

export const orderListViewSchema = orderSchema
  .omit({ storeId: true, createdBy: true })
  .extend({
    store: storeSchema,
    createdBy: userRefSchema,
    shipment: shipmentSchema.nullable(),
  });

export type OrderListView = z.infer<typeof orderListViewSchema>;
