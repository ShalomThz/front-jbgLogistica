import z from "zod";

export const shippingLabelSchema = z.object({
  id: z.string(),
  format: z.string(),
  documentUrl: z.string().nullish(),
  provider: z.string(),
  trackingNumber: z.string().nullish(),
  trackingUrl: z.string().nullish(),
  generatedAt: z.iso.datetime({ offset: true }),
});

export type ShippingLabelPrimitives = z.infer<typeof shippingLabelSchema>;
