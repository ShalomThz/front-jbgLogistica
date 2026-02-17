import { z } from "zod";
import { emailSchema} from "@contexts/shared/domain/schemas/Email";
import { addressSchema } from "@contexts/shared/domain/schemas/address/Address";
import { aggregateRootSchema } from "@contexts/shared/domain/schemas/AggregateRoot";

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
