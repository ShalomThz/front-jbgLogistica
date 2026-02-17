import { moneySchema } from "@contexts/shared/domain/schemas/Money";
import z from "zod";

export const rateSchema = z.object({
  id: z.string(),
  serviceName: z.string(),
  price: moneySchema,
  insuranceFee: moneySchema,
  isOcurre: z.boolean(),
  estimatedDays: z.number().nullish(),
});

export type RatePrimitives = z.infer<typeof rateSchema>;
