import { z } from "zod";
import {
  aggregateRootSchema,
} from "@/shared/domain";
import { customerProfileSchema } from "./CustomerProfile";
import { orderFinancialsSchema } from "./OrderFinancials";
import { orderReferencesSchema } from "./OrderReferences";
import { packageSchema } from "./Package";
import { createAddressSchema } from "../../../../../shared/domain/schemas/address/Address";
 
export const orderTypes = ["PARTNER", "HQ"] as const;
export const orderStatuses = [
  "DRAFT",
  "PENDING_HQ_PROCESS",
  "COMPLETED",
  "CANCELLED",
] as const;

export const orderSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  origin: customerProfileSchema,
  destination: customerProfileSchema,
  financials: orderFinancialsSchema,
  references: orderReferencesSchema,
  status: z.enum(orderStatuses),
  package: packageSchema,
  type: z.enum(orderTypes),
  ...aggregateRootSchema.shape,
});

export type OrderType = z.infer<typeof orderSchema.shape.type>;
export type OrderStatus = z.infer<typeof orderSchema.shape.status>;
export type OrderPrimitives = z.infer<typeof orderSchema>;

export const createHQOrderSchema = z.object({
  references: orderReferencesSchema,
  package: packageSchema,
  origin: z.object({
    ...customerProfileSchema.shape,
    address: createAddressSchema,
  }),
  destination: z.object({
    ...customerProfileSchema.shape,
    address: createAddressSchema,
  }),
  saveOriginCustomer: z.boolean().default(false),
  saveDestinationCustomer: z.boolean().default(false),
});

export type CreateHQOrderRequest = z.infer<typeof createHQOrderSchema>;