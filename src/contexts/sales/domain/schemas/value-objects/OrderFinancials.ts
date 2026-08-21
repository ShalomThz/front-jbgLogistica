import { moneySchema } from "@contexts/shared/domain/schemas/Money";
import { PAYMENT_METHODS } from "@contexts/shared/domain/schemas/PaymentMethod";
import { PAYMENT_STATUSES } from "@contexts/shared/domain/schemas/PaymentStatus";
import { costBreakdownSchema } from "./CostBreakdown";
import { discountSchema } from "./Discount";
import z from "zod";

/** Un abono registrado contra la orden. El monto puede estar en cualquier
 * moneda; el backend deriva el paymentStatus convirtiéndolo al de facturación. */
export const paymentSchema = z.object({
  id: z.string(),
  amount: moneySchema,
  /** Snapshot aplicado a la moneda facturada por el backend. */
  appliedAmount: moneySchema.nullable().default(null),
  exchangeRate: z.number().positive().nullable().default(null),
  source: z.enum(["MANUAL", "CLOVER", "LEGACY"]).nullable().default(null),
  method: z.enum(PAYMENT_METHODS),
  concept: z.string().nullable().default(null),
  /** Marca de tiempo ISO en que se registró el abono. */
  date: z.string(),
  externalReference: z
    .object({
      provider: z.literal("CLOVER"),
      paymentId: z.string(),
      checkoutSessionId: z.string(),
    })
    .nullable()
    .default(null),
});

export type PaymentPrimitives = z.infer<typeof paymentSchema>;

export const orderFinancialsSchema = z.object({
  tariff: moneySchema.nullable(),
  totalPrice: moneySchema.nullable(),
  totalBilled: moneySchema.nullable().default(null),
  /** Derivado de paymentStatus (=== "PAID"); se conserva por compatibilidad. */
  isPaid: z.boolean().default(false),
  /** Progreso del pago; derivado de los abonos vs. totalBilled. */
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  /** Método con el que se liquidó; null hasta que se marca pagada. */
  paymentMethod: z.enum(PAYMENT_METHODS).nullable().default(null),
  /** Nota libre del pago (p. ej. referencia de la transferencia). */
  paymentConcept: z.string().nullable().default(null),
  /** Libro de abonos parciales. Vacío para órdenes previas al campo o
   * liquidadas por el flujo antiguo de pago único. */
  payments: z.array(paymentSchema).default([]),
  totalPaid: moneySchema.nullable().optional(),
  outstanding: moneySchema.nullable().optional(),
  credit: moneySchema.nullable().optional(),
  ledgerVersion: z.literal(1).optional(),
  costBreakdown: costBreakdownSchema,
  discount: discountSchema,
});

export type OrderFinancialsPrimitives = z.infer<typeof orderFinancialsSchema>;
