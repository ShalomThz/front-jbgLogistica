import { customerSchema } from "@contexts/sales/domain/schemas/customer/Customer";
import { createAddressSchema } from "@contexts/shared/domain/schemas/address/Address";
import type z from "zod";

export const createCustomerRequestSchema = customerSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    address: true,
  })
  .extend({
    address: createAddressSchema,
  });

export type CreateCustomerRequest = z.infer<typeof createCustomerRequestSchema>;
