import { customerProfileSchema } from "@contexts/sales/domain/schemas/value-objects/CustomerProfile";
import { orderReferencesSchema } from "@contexts/sales/domain/schemas/value-objects/OrderReferences";
import { packageSchema } from "@contexts/sales/domain/schemas/value-objects/Package";
import { createAddressSchema } from "@contexts/shared/domain/schemas/address/Address";
import z from "zod";

export const createHQOrderSchema = z.object({
  storeId: z.string(),
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
});

export type CreateHQOrderRequest = z.infer<typeof createHQOrderSchema>;
