import { z } from "zod";
import { moneySchema } from "@/shared/domain";

export const rateSchema = z.object({
  id: z.string(),
  serviceName: z.string(),
  price: moneySchema,
  insuranceFee: moneySchema,
  isOcurre: z.boolean(),
  estimatedDays: z.number().optional(),
});

export type RatePrimitives = z.infer<typeof rateSchema>;