import { costBreakdownSchema } from "@contexts/sales/domain/schemas/value-objects/CostBreakdown";
import { aggregateRootSchema } from "@contexts/shared/domain/schemas/AggregateRoot";
import { moneySchema } from "@contexts/shared/domain/schemas/Money";
import { carrierSchema } from "../value-objects/Carrier";
import { parcelSchema } from "../value-objects/Parcel";
import { rateSchema } from "../value-objects/Rate";
import { shippingLabelSchema } from "../value-objects/ShippingLabel";
import { shipmentStatuses } from "./ShipmentStatues";
import z from "zod";

export const shipmentSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  provider: carrierSchema.nullable(),
  label: shippingLabelSchema.nullable(),
  rate: rateSchema.nullable(),
  status: z.enum(shipmentStatuses),
  finalPrice: moneySchema.nullable(),
  costBreakdown: costBreakdownSchema.nullable(),
  additionalData: z.record(z.string(), z.string()).optional(),
  parcel: parcelSchema,
  ...aggregateRootSchema.shape,
});

export type ShipmentStatus = z.infer<typeof shipmentSchema.shape.status>;
export type ShipmentPrimitives = z.infer<typeof shipmentSchema>;
