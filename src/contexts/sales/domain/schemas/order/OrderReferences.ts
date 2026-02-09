import { z } from "zod";

export const orderReferencesSchema = z.object({
  orderNumber: z.string().nullable(),
  partnerOrderNumber: z.string().nullable(),
});

export type OrderReferencesPrimitives = z.infer<typeof orderReferencesSchema>;