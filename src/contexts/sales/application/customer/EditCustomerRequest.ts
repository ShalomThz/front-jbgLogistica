import { customerSchema } from "@contexts/sales/domain/schemas/customer/Customer";
import { createAddressSchema } from "@contexts/shared/domain/schemas/address/Address";
import z from "zod";

export const editCustomerRequestSchema = z.object({
  id: customerSchema.shape.id,
  photo: z.string().min(1).optional(),
  name: customerSchema.shape.name.optional(),
  company: customerSchema.shape.company.optional(),
  email: customerSchema.shape.email.optional(),
  phone: customerSchema.shape.phone.optional(),
  secondaryPhone: customerSchema.shape.secondaryPhone.optional(),
  address: createAddressSchema.optional(),
});

export type EditCustomerRequest = z.infer<typeof editCustomerRequestSchema>;
