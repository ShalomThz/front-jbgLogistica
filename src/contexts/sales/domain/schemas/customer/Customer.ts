import { aggregateRootSchema } from "@contexts/shared/domain/schemas/AggregateRoot";
import { addressSchema, createAddressSchema } from "@contexts/shared/domain/schemas/address/Address";
import { emailSchema } from "@contexts/shared/domain/schemas/Email";
import { z } from "zod";

export const customerSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Customer name is required"),
  company: z.string().min(1, "Company is required"),
  email: emailSchema,
  phone: z.string().min(1, "Phone number is required"),
  registeredByStoreId: z.string(),
  address: addressSchema,
  ...aggregateRootSchema.shape,
});

export type CustomerPrimitives = z.infer<typeof customerSchema>;

export const createCustomerSchema = customerSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  address: true,
}).extend({
  address: createAddressSchema,
});

export type CreateCustomerRequest = z.infer<typeof createCustomerSchema>;
