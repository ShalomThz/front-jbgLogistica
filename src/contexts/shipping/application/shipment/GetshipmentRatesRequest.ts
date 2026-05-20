import z from "zod";
import { warehouseAddressSchema } from "../../domain/schemas/value-objects/WarehouseAddress";

export const getShipmentRatesSchema = z.object({
  shipmentId: z.string(),
  additionalData: z.record(z.string(), z.string()),
  warehouseAddress: warehouseAddressSchema
});

export type GetShipmentRatesRequest = z.infer<typeof getShipmentRatesSchema>;
