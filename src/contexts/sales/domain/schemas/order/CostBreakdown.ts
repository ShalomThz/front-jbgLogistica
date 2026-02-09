import z from "zod";
import { moneySchema } from "../../../../../shared/domain";

export const costBreakdownSchema = z.object({
  insurance: moneySchema.nullable().default(null),
  tools: moneySchema.nullable().default(null),
  additionalCost: moneySchema.nullable().default(null),
  wrap: moneySchema.nullable().default(null),
  tape: moneySchema.nullable().default(null),
});

export type CostBreakdownPrimitives = z.infer<typeof costBreakdownSchema>;