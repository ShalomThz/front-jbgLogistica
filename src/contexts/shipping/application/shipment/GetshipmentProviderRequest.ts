import { costBreakdownSchema } from "@contexts/sales/domain/schemas/value-objects/CostBreakdown";
import { discountSchema } from "@contexts/sales/domain/schemas/value-objects/Discount";
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
  tariff: moneySchema,
  costBreakdown: costBreakdownSchema,
  /** Viaja junto con la tarifa (mismo paso) para que el pricing del
   * fulfillment ya lo reste del totalBilled. */
  discount: discountSchema.optional(),
});

export type SelectShipmentProviderRequest = z.infer<
  typeof selectShipmentProviderRequestSchema
>;
