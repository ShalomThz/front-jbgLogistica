import { customerProfileSchema } from "@contexts/sales/domain/schemas/value-objects/CustomerProfile";
import { orderReferencesSchema } from "@contexts/sales/domain/schemas/value-objects/OrderReferences";
import { packageSchema } from "@contexts/sales/domain/schemas/value-objects/Package";
import { discountSchema } from "@contexts/sales/domain/schemas/value-objects/Discount";
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
  pickupAtAddress: z.boolean().optional(),
  customerSignature: z.string().nullish(),
  markAsPaid: z.boolean().nullish(),
  discount: discountSchema.optional(),
});

export type EditOrderRequest = z.infer<typeof editOrderRequestSchema>;
