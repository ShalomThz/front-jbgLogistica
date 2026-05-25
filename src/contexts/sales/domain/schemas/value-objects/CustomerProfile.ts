import { addressSchema } from "@contexts/shared/domain/schemas/address/Address";
import z from "zod";

export const customerProfileSchema = z.object({
  id: z.string().nullable(),
  customerNumber: z.number().nullable().optional(),
  name: z.string().min(1, "Name is required"),
  company: z.string().min(1, "Company is required"),
  email: z.string().nullable().default(null),
  phone: z.string().min(1, "Phone is required"),
  address: addressSchema,
});

export type CustomerProfilePrimitives = z.infer<typeof customerProfileSchema>;
