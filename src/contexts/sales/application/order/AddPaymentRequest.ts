import { PAYMENT_METHODS } from "@contexts/shared/domain/schemas/PaymentMethod";
import { moneySchema } from "@contexts/shared/domain/schemas/Money";
import z from "zod";

export const addPaymentRequestSchema = z.object({
  /** Lo genera el formulario al capturar el abono y lo conserva hasta que se
   * registra: si la respuesta se pierde y se reintenta, el back reconoce el
   * mismo id y no lo vuelve a registrar. */
  id: z.uuid().optional(),
  amount: moneySchema,
  method: z.enum(PAYMENT_METHODS),
  concept: z.string().nullish(),
});

export type AddPaymentRequest = z.infer<typeof addPaymentRequestSchema>;
