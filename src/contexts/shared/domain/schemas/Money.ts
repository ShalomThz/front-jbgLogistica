import { z } from "zod";

export const moneySchema = z.object({
  amount: z.number().min(0, "Amount cannot be negative"),
  currency: z
    .string()
    .length(3, "Currency must be 3 characters")
    .default("USD"),
});

export type MoneyPrimitives = z.infer<typeof moneySchema>;
