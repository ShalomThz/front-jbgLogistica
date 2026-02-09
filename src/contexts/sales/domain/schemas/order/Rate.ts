import { z } from "zod";
import { moneySchema } from "@/shared/domain";
export const rateSchema = z.object({
  id: z.string(),
  provider: z.string(),
  price: moneySchema,
  insuranceFee: moneySchema,
  isOcurre: z.boolean(),
});

export type RatePrimitives = z.infer<typeof rateSchema>;