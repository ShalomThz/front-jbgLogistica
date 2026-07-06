import { moneySchema } from "@contexts/shared/domain/schemas/Money";
import { costBreakdownSchema } from "./CostBreakdown";
import { discountSchema } from "./Discount";
import z from "zod";

export const orderFinancialsSchema = z.object({
  tariff: moneySchema.nullable(),
  totalPrice: moneySchema.nullable(),
  totalBilled: moneySchema.nullable().default(null),
  /** Derivado de paymentStatus (=== "PAID"); se conserva por compatibilidad. */
  isPaid: z.boolean().default(false),
  /** Progreso del pago: anticipo cobrado (caja vacía) = PARTIALLY_PAID. */
  paymentStatus: z.enum(["UNPAID", "PARTIALLY_PAID", "PAID"]).optional(),
  /** Anticipo cobrado al solicitar la entrega de caja vacía a domicilio. */
  advance: moneySchema.nullable().default(null),
  costBreakdown: costBreakdownSchema,
  discount: discountSchema,
});

export type OrderFinancialsPrimitives = z.infer<typeof orderFinancialsSchema>;
