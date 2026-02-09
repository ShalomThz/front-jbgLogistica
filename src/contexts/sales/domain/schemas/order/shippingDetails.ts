import { z } from "zod";
import { carrierSchema } from "./Carrier";
export const shippingDetailsSchema = z.object({
  provider: carrierSchema.nullable(),
  labelUrl: z.string().nullable(),
  trackingUrl: z.string().nullable(),
  trackingNumber: z.string().nullable(),
});

export type ShippingDetailsPrimitives = z.infer<typeof shippingDetailsSchema>;