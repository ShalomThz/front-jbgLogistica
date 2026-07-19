import { z } from "zod";
import { baseOrderFormSchema, basePackageSchema } from "./BaseOrderForm";

// --- Partner form ---

// El anticipo de caja vacía ya no vive en el form: se captura como abono en el
// paso de precios y se valida al enviar (usePartnerOrderSubmission).
export const partnerOrderFormSchema = baseOrderFormSchema.extend({
  orderType: z.literal("PARTNER"),
  package: basePackageSchema,
});

export type PartnerOrderFormValues = z.infer<typeof partnerOrderFormSchema>;
export type PartnerPackageFormData = PartnerOrderFormValues["package"];
