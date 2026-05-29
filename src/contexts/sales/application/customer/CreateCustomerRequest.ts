import { customerSchema } from "@contexts/sales/domain/schemas/customer/Customer";
import { createAddressSchema } from "@contexts/shared/domain/schemas/address/Address";
import { z } from "zod";

export const createCustomerRequestSchema = customerSchema
  .omit({
    id: true,
    customerNumber: true,
    createdAt: true,
    updatedAt: true,
    address: true,
  })
  .extend({
    registeredByStoreId: z.string().min(1, "Tienda es requerida"),
    address: createAddressSchema,
  });

export type CreateCustomerRequest = z.infer<typeof createCustomerRequestSchema>;
