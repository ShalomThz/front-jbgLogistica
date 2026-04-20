import { createCustomerSchema } from "@contexts/sales/domain/schemas/customer/Customer";
import { z } from "zod";

export const editCustomerRequestSchema = z.object({
  id: z.string(),
  name: createCustomerSchema.shape.name.optional(),
  company: createCustomerSchema.shape.company.optional(),
  email: createCustomerSchema.shape.email.optional(),
  phone: createCustomerSchema.shape.phone.optional(),
  address: createCustomerSchema.shape.address.optional(),
});

export type EditCustomerRequest = z.infer<typeof editCustomerRequestSchema>;
