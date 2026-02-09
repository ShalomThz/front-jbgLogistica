import { z } from "zod";
export const orderReferencesSchema = z.object({
  partnerInvoice: z.string().nullable(),
  officialInvoice: z.string().nullable(),
  partnerInvoiceUrl: z.url().nullable(),
  officialInvoiceUrl: z.url().nullable(),
});

export type OrderReferencesPrimitives = z.infer<typeof orderReferencesSchema>;