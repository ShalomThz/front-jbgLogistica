import { z } from "zod";
import { baseOrderFormSchema, basePackageSchema } from "./BaseOrderForm";

// --- Partner form ---

export const partnerOrderFormSchema = baseOrderFormSchema.extend({
  orderType: z.literal("PARTNER"),
  package: basePackageSchema,
});

export type PartnerOrderFormValues = z.infer<typeof partnerOrderFormSchema>;
export type PartnerPackageFormData = PartnerOrderFormValues["package"];
