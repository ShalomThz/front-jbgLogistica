import { moneySchema } from "@contexts/shared/domain/schemas/Money";
import z from "zod";

export const costBreakdownSchema = z.object({
  insurance: moneySchema.nullable().default(null),
  tools: moneySchema.nullable().default(null),
  additionalCost: moneySchema.nullable().default(null),
  wrap: moneySchema.nullable().default(null),
  tape: moneySchema.nullable().default(null),
});

export type CostBreakdownPrimitives = z.infer<typeof costBreakdownSchema>;
