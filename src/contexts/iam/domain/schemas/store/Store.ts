import { z } from "zod";
import { emailSchema, aggregateRootSchema, addressSchema } from "@/shared/domain";

export const storeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Store name is required"),
  zoneId: z.string(),
  address: addressSchema,
  phone: z.string().min(1, "Phone number is required"),
  contactEmail: emailSchema,
  ...aggregateRootSchema.shape,
});

export type StorePrimitives = z.infer<typeof storeSchema>;
