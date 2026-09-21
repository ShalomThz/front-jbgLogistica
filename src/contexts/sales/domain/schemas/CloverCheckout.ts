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
