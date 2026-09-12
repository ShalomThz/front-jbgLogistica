import { z } from "zod";

// Exigida, sin default, igual que en el back: con `.default("USD")` un builder
// al que se le olvidaba la moneda pasaba el `.parse()` y mandaba el importe como
// dólares. Ni `tsc` ni zod lo veían.
export const moneySchema = z.object({
  amount: z.number().min(0, "Amount cannot be negative"),
  currency: z.string().length(3, "Currency must be 3 characters"),
});

export type MoneyPrimitives = z.infer<typeof moneySchema>;
