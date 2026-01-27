import { z } from 'zod';

export const OrderReferencesSchema = z.object({
  partnerInvoiceNumber: z.string().nullable(),
  officialInvoiceNumber: z.string().nullable(),
});

export type OrderReferences = z.infer<typeof OrderReferencesSchema>;
