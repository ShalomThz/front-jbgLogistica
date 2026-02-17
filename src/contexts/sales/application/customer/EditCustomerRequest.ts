import { customerSchema } from "@contexts/sales/domain/schemas/customer/Customer";
import { createAddressSchema } from "@contexts/shared/domain/schemas/address/Address";
import z from "zod";

export const editCustomerRequestSchema = z.object({
  id: customerSchema.shape.id,
  name: customerSchema.shape.name.optional(),
  company: customerSchema.shape.company.optional(),
  email: customerSchema.shape.email.optional(),
  phone: customerSchema.shape.phone.optional(),
  address: createAddressSchema.optional(),
});

export type EditCustomerRequest = z.infer<typeof editCustomerRequestSchema>;
