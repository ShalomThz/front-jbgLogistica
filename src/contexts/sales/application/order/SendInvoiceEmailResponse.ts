import { z } from "zod";

export const sendInvoiceEmailResponseSchema = z.object({
  invoiceNumber: z.string(),
  recipientEmail: z.email(),
});

export type SendInvoiceEmailResponse = z.infer<
  typeof sendInvoiceEmailResponseSchema
>;
