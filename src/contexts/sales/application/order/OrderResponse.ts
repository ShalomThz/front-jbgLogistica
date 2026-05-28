import { storeResponseSchema } from "@contexts/iam/application/store/StoreResponse";
import { userListViewSchema } from "@contexts/iam/domain/schemas/user/User";
import { orderSchema } from "@contexts/sales/domain/schemas/order/Order";
import { customerProfileSchema } from "@contexts/sales/domain/schemas/value-objects/CustomerProfile";
import { shipmentResponseSchema } from "@contexts/shipping/application/shipment/ShipmentResponse";
import { responseAddressSchema } from "@contexts/shared/domain/schemas/address/Address";
import { z } from "zod";

export const customerProfileResponseSchema = customerProfileSchema.extend({
  address: responseAddressSchema,
});

export type CustomerProfileResponsePrimitives = z.infer<
  typeof customerProfileResponseSchema
>;

export const orderResponseSchema = orderSchema.extend({
  origin: customerProfileResponseSchema,
  destination: customerProfileResponseSchema,
});

export type OrderResponsePrimitives = z.infer<typeof orderResponseSchema>;

export const orderListViewResponseSchema = orderResponseSchema
  .omit({ storeId: true, createdBy: true })
  .extend({
    store: storeResponseSchema,
    createdBy: userListViewSchema,
    shipment: shipmentResponseSchema.nullable(),
  });

export type OrderListViewResponse = z.infer<typeof orderListViewResponseSchema>;
