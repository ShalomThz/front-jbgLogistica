import { customerProfileSchema } from "@contexts/sales/domain/schemas/value-objects/CustomerProfile";
import { orderReferencesSchema } from "@contexts/sales/domain/schemas/value-objects/OrderReferences";
import { packageSchema } from "@contexts/sales/domain/schemas/value-objects/Package";
import { discountSchema } from "@contexts/sales/domain/schemas/value-objects/Discount";
import { PAYMENT_METHODS } from "@contexts/shared/domain/schemas/PaymentMethod";
import { createAddressSchema } from "@contexts/shared/domain/schemas/address/Address";
import z from "zod";

export const editOrderRequestSchema = z.object({
  storeId: z.string().optional(),
  origin: z.object({
    ...customerProfileSchema.shape,
    address: createAddressSchema,
  }).optional(),
  destination: z.object({
    ...customerProfileSchema.shape,
    address: createAddressSchema,
  }).optional(),
  references: orderReferencesSchema.partial().optional(),
  package: packageSchema.optional(),
  emptyBoxDelivery: z.boolean().optional(),
  homePickup: z.boolean().optional(),
  customerSignature: z.string().nullish(),
  markAsPaid: z.boolean().nullish(),
  /** El backend lo exige cuando markAsPaid es true. */
  paymentMethod: z.enum(PAYMENT_METHODS).nullish(),
  paymentConcept: z.string().nullish(),
  discount: discountSchema.optional(),
});

export type EditOrderRequest = z.infer<typeof editOrderRequestSchema>;
