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
  method: z.enum(PAYMENT_METHODS),
  concept: z.string().nullable().default(null),
  /** Marca de tiempo ISO en que se registró el abono. */
  date: z.string(),
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
  costBreakdown: costBreakdownSchema,
  discount: discountSchema,
});

export type OrderFinancialsPrimitives = z.infer<typeof orderFinancialsSchema>;
