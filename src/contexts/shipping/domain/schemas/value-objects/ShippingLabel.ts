import z from "zod";

export const shippingLabelSchema = z.object({
  id: z.string(),
  format: z.string(),
  documentUrl: z.url(),
  provider: z.string(),
  trackingNumber: z.string(),
  trackingUrl: z.url(),
  generatedAt: z.iso.datetime({ offset: true }),
});

export type ShippingLabelPrimitives = z.infer<typeof shippingLabelSchema>;
