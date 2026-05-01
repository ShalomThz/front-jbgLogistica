import { moneySchema } from "@contexts/shared/domain/schemas/Money";
import { costBreakdownSchema } from "./CostBreakdown";
import { discountSchema } from "./Discount";
import z from "zod";

export const orderFinancialsSchema = z.object({
  tariff: moneySchema.nullable(),
  totalPrice: moneySchema.nullable(),
  isPaid: z.boolean().default(false),
  costBreakdown: costBreakdownSchema,
  discount: discountSchema,
});

export type OrderFinancialsPrimitives = z.infer<typeof orderFinancialsSchema>;
