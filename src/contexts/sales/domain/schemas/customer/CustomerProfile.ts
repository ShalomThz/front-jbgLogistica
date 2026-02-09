import { z } from "zod";
import { emailSchema, addressSchema } from "@/shared/domain";
export const customerProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().min(1, "Company is required"),
  email: emailSchema,
  phone: z.string().min(1, "Phone is required"),
  address: addressSchema,
});

export type CustomerProfilePrimitives = z.infer<typeof customerProfileSchema>;