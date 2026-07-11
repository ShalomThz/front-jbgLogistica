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
  createdBy: z.string(),
  origin: customerProfileSchema,
  destination: customerProfileSchema,
  financials: orderFinancialsSchema,
  references: orderReferencesSchema,
  status: z.enum(orderStatuses),
  package: packageSchema,
  type: z.enum(orderTypes),
  /** "Dejar caja vacía a domicilio": caja entregada al remitente con anticipo
   * cobrado, recolectada y almacenada antes del proceso HQ. */
  emptyBoxDelivery: z.boolean().default(false),
  /** "Recolección a domicilio": el chofer recoge directamente la caja ya
   * empacada del remitente, sin dejar caja vacía antes. Excluyente con
   * emptyBoxDelivery. */
  homePickup: z.boolean().default(false),
  customerSignature: z.string().nullish(),
  ...aggregateRootSchema.shape,
});

export type OrderType = z.infer<typeof orderSchema.shape.type>;
export type OrderStatus = z.infer<typeof orderSchema.shape.status>;
export type OrderPrimitives = z.infer<typeof orderSchema>;
