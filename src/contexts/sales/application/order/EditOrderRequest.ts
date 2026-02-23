import { customerProfileSchema } from "@contexts/sales/domain/schemas/value-objects/CustomerProfile";
import { orderReferencesSchema } from "@contexts/sales/domain/schemas/value-objects/OrderReferences";
import { packageSchema } from "@contexts/sales/domain/schemas/value-objects/Package";
import { createAddressSchema } from "@contexts/shared/domain/schemas/address/Address";
import z from "zod";

export const editOrderRequestSchema = z.object({
  origin: z.object({
    ...customerProfileSchema.shape,
    address: createAddressSchema,
  }).optional(),
  destination: z.object({
    ...customerProfileSchema.shape,
    address: createAddressSchema,
  }).optional(),
  references: orderReferencesSchema.optional(),
  package: packageSchema.optional(),
});

export type EditOrderRequest = z.infer<typeof editOrderRequestSchema>;
