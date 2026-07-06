import { z } from "zod";
import { baseOrderFormSchema, basePackageSchema } from "./BaseOrderForm";

// --- Partner form ---

export const partnerOrderFormSchema = baseOrderFormSchema
  .extend({
    orderType: z.literal("PARTNER"),
    package: basePackageSchema,
  })
  .superRefine((values, ctx) => {
    if (values.emptyBoxDelivery && !(parseFloat(values.advanceAmount) > 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["advanceAmount"],
        message: "El anticipo es requerido para dejar caja vacía",
      });
    }
  });

export type PartnerOrderFormValues = z.infer<typeof partnerOrderFormSchema>;
export type PartnerPackageFormData = PartnerOrderFormValues["package"];
