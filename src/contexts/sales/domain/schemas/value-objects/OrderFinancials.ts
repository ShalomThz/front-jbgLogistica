import { moneySchema } from "@contexts/shared/domain/schemas/Money";
import { costBreakdownSchema } from "./CostBreakdown";
import z from "zod";

export const orderFinancialsSchema = z.object({
  totalPrice: moneySchema.nullable(),
  isPaid: z.boolean().default(false),
  costBreakdown: costBreakdownSchema,
});

export type OrderFinancialsPrimitives = z.infer<typeof orderFinancialsSchema>;
