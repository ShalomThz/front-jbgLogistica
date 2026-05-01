import { moneySchema } from "@contexts/shared/domain/schemas/Money";
import z from "zod";

export const discountSchema = z.object({
  amount: moneySchema.nullable().default(null),
  concept: z.string().nullable().default(null),
});

export type DiscountPrimitives = z.infer<typeof discountSchema>;
