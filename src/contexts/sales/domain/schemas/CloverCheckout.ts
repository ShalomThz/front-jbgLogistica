import { moneySchema } from "@contexts/shared/domain/schemas/Money";
import z from "zod";

export const cloverCheckoutSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  checkoutSessionId: z.string(),
  publicToken: z.string(),
  href: z.string().url(),
  amount: moneySchema,
  status: z.enum(["PENDING", "APPROVED", "DECLINED", "EXPIRED"]),
  cloverPaymentId: z.string().nullable(),
  createdBy: z.string(),
  expiresAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CloverCheckout = z.infer<typeof cloverCheckoutSchema>;

export const publicCloverCheckoutSchema = cloverCheckoutSchema.pick({
  amount: true,
  status: true,
  expiresAt: true,
});

export type PublicCloverCheckout = z.infer<typeof publicCloverCheckoutSchema>;

/** A quién se le manda el enlace: el remitente (`origin`) o el destinatario
 * (`destination`) de la orden — cada orden guarda ambos correos y no siempre
 * quien paga es el mismo que aparece primero en el envío. */
export const cloverCheckoutEmailRecipients = ["origin", "destination"] as const;
export type CloverCheckoutEmailRecipient =
  (typeof cloverCheckoutEmailRecipients)[number];
