import { storeSchema } from "@contexts/iam/domain/schemas/store/Store";
import { customerSchema } from "@contexts/sales/domain/schemas/customer/Customer";
import { responseAddressSchema } from "@contexts/shared/domain/schemas/address/Address";
import { z } from "zod";

export const customerResponseSchema = customerSchema.extend({
  name: z.string().optional().default(""),
  company: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  address: responseAddressSchema,
});

export type CustomerResponsePrimitives = z.infer<typeof customerResponseSchema>;

export const customerListViewResponseSchema = customerResponseSchema
  .omit({ registeredByStoreId: true, userId: true })
  .extend({
    // Identidad de la tienda, no la tienda entera: el backend dejó de mandar
    // el resto y nadie lo leía.
    store: storeSchema.pick({ id: true, name: true }),
    user: z.object({ id: z.string() }).passthrough().nullable().default(null),
  });

export type CustomerListViewResponsePrimitives = z.infer<
  typeof customerListViewResponseSchema
>;
