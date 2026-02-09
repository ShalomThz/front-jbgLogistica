import { z } from "zod";
import { aggregateRootSchema } from "@/shared/domain";
import { addressSchema } from "@/shared/domain";
import { emailSchema } from "@/shared/domain";
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

//create customer use case


