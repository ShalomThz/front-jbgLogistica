import { z } from "zod";
import { baseOrderFormSchema, basePackageSchema } from "./BaseOrderForm";

// --- Partner form ---

// El anticipo de caja vacía ya no vive en el form: se captura como abono en el
// paso de precios y se valida al enviar (usePartnerOrderSubmission).
export const partnerOrderFormSchema = baseOrderFormSchema.extend({
  orderType: z.literal("PARTNER"),
  package: basePackageSchema,
  /** Lo que el socio le cobra a su propio cliente. Va acá y no en el formulario
   * base porque en una orden HQ no hay tercero que revenda. Es texto como el
   * resto de los montos del formulario; se convierte al armar el request. */
  partnerSale: z.string(),
});

export type PartnerOrderFormValues = z.infer<typeof partnerOrderFormSchema>;
export type PartnerPackageFormData = PartnerOrderFormValues["package"];
