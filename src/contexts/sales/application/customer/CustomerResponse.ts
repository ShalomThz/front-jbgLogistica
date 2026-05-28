import { storeSchema } from "@contexts/iam/domain/schemas/store/Store";
import { customerSchema } from "@contexts/sales/domain/schemas/customer/Customer";
import { responseAddressSchema } from "@contexts/shared/domain/schemas/address/Address";
import { z } from "zod";

export const customerResponseSchema = customerSchema.extend({
  address: responseAddressSchema,
});

export type CustomerResponsePrimitives = z.infer<typeof customerResponseSchema>;

export const customerListViewResponseSchema = customerResponseSchema
  .omit({ registeredByStoreId: true, userId: true })
  .extend({
    store: storeSchema,
    user: z.object({ id: z.string() }).passthrough().nullable().default(null),
  });

export type CustomerListViewResponsePrimitives = z.infer<
  typeof customerListViewResponseSchema
>;
