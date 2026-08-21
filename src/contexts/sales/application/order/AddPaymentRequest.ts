import { MANUAL_PAYMENT_METHODS } from "@contexts/shared/domain/schemas/PaymentMethod";
import { moneySchema } from "@contexts/shared/domain/schemas/Money";
import z from "zod";

export const addPaymentRequestSchema = z.object({
  amount: moneySchema,
  method: z.enum(MANUAL_PAYMENT_METHODS),
  concept: z.string().nullish(),
});

export type AddPaymentRequest = z.infer<typeof addPaymentRequestSchema>;
