import { z } from "zod";
import {
  aggregateRootSchema,
} from "@/shared/domain";
import { customerProfileSchema } from "../customer/CustomerProfile";
import { orderFinancialsSchema } from "./OrderFinancials";
import { orderReferencesSchema } from "./OrderReferences";
import { packageSchema } from "./Package";
import { shippingDetailsSchema } from "./shippingDetails";


export const orderStatuses = [
  "DRAFT",
  "PENDING_HQ_PROCESS",
  "COMPLETED",
  "CANCELLED",
] as const;

export const shipmentOrderSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  origin: customerProfileSchema,
  destination: customerProfileSchema,
  financials: orderFinancialsSchema,
  references: orderReferencesSchema,
  status: z.enum(orderStatuses),
  package: packageSchema,
  shippingDetails: shippingDetailsSchema,
  ...aggregateRootSchema.shape,
});

export type OrderStatus = z.infer<typeof shipmentOrderSchema.shape.status>;
export type ShipmentOrderPrimitives = z.infer<typeof shipmentOrderSchema>;

