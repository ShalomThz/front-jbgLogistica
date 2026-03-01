import z from "zod";

export const shippingLabelSchema = z.object({
  id: z.string(),
  format: z.string(),
  documentUrl: z.string(),
  provider: z.string(),
  trackingNumber: z.string(),
  trackingUrl: z.string(),
  generatedAt: z.iso.datetime({ offset: true }),
});

export type ShippingLabelPrimitives = z.infer<typeof shippingLabelSchema>;
