import { customerProfileSchema } from "@contexts/sales/domain/schemas/value-objects/CustomerProfile";
import { packageSchema } from "@contexts/sales/domain/schemas/value-objects/Package";
import { createAddressSchema } from "@contexts/shared/domain/schemas/address/Address";
import z from "zod";

export const createPartnerOrderSchema = z.object({
  storeId: z.string(),
  partnerOrderNumber: z.string(),
  package: packageSchema,
  origin: z.object({
    ...customerProfileSchema.shape,
    address: createAddressSchema,
  }),
  destination: z.object({
    ...customerProfileSchema.shape,
    address: createAddressSchema,
  }),
});

export type CreatePartnerOrderRequest = z.infer<
  typeof createPartnerOrderSchema
>;
