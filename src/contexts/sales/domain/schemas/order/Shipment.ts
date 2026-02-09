import z from "zod";
import { carrierSchema } from "./Carrier";
import { shippingLabelSchema } from "./ShipmentLabel";
import { rateSchema } from "./Rate";
import { aggregateRootSchema, moneySchema } from "../../../../../shared/domain";
import { costBreakdownSchema } from "./CostBreakdown";
import { parcelSchema } from "./Parcel";

const shipmentStatuses = [
    "DRAFT",
    "PROVIDER_SELECTED",
    "FULFILLED",
    "CANCELLED",
] as const;

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