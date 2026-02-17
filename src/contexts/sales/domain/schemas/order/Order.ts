import { aggregateRootSchema } from "@contexts/shared/domain/schemas/AggregateRoot";
import { customerProfileSchema } from "../value-objects/CustomerProfile";
import { orderFinancialsSchema } from "../value-objects/OrderFinancials";
import { orderReferencesSchema } from "../value-objects/OrderReferences";
import { packageSchema } from "../value-objects/Package";
import { orderStatuses } from "./OrderStatuses";
import { orderTypes } from "./OrderTypes";
import z from "zod";

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
