import { costBreakdownSchema } from "@contexts/sales/domain/schemas/value-objects/CostBreakdown";
import { moneySchema } from "@contexts/shared/domain/schemas/Money";
import { shipmentSchema } from "@contexts/shipping/domain/schemas/shipment/Shipment";
import { carrierSchema } from "@contexts/shipping/domain/schemas/value-objects/Carrier";
import { rateSchema } from "@contexts/shipping/domain/schemas/value-objects/Rate";
import z from "zod";

export const selectShipmentProviderRequestSchema = z.object({
  shipmentId: shipmentSchema.shape.id,
  provider: carrierSchema,
  rate: rateSchema,
  finalPrice: moneySchema,
  costBreakdown: costBreakdownSchema,
});

export type SelectShipmentProviderRequest = z.infer<
  typeof selectShipmentProviderRequestSchema
>;
