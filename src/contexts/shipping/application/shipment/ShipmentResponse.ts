import { shipmentSchema } from "@contexts/shipping/domain/schemas/shipment/Shipment";
import { warehouseAddressSchema } from "@contexts/shipping/domain/schemas/value-objects/WarehouseAddress";
import { responseAddressSchema } from "@contexts/shared/domain/schemas/address/Address";
import { z } from "zod";

export const warehouseAddressResponseSchema = warehouseAddressSchema.extend({
  address: responseAddressSchema,
});

export type WarehouseAddressResponsePrimitives = z.infer<
  typeof warehouseAddressResponseSchema
>;

export const shipmentResponseSchema = shipmentSchema.extend({
  warehouseAddress: warehouseAddressResponseSchema.nullable(),
});

export type ShipmentResponsePrimitives = z.infer<typeof shipmentResponseSchema>;
