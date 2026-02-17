import z from "zod";

export const getShipmentRatesSchema = z.object({
  shipmentId: z.string(),
  additionalData: z.record(z.string(), z.string()).optional(),
});

export type GetShipmentRatesRequest = z.infer<typeof getShipmentRatesSchema>;
