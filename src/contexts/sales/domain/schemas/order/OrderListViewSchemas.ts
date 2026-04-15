import { z } from "zod";
import { orderSchema } from "./Order";
import { storeSchema } from "@contexts/iam/domain/schemas/store/Store";
import { userListViewSchema } from "@contexts/iam/domain/schemas/user/User";
import { shipmentSchema } from "@contexts/shipping/domain/schemas/shipment/Shipment";

export const orderListViewSchema = orderSchema
  .omit({ storeId: true, createdBy: true })
  .extend({
    store: storeSchema,
    createdBy: userListViewSchema,
    shipment: shipmentSchema.nullable(),
    invoiceId: z.string().nullable(),
  });

export type OrderListView = z.infer<typeof orderListViewSchema>;
