import { z } from "zod";

export const findTariffPriceRequestSchema = z.object({
  zoneId: z.string(),
  destinationCountry: z.string(),
  boxId: z.string(),
});

export type FindTariffPriceRequest = z.infer<typeof findTariffPriceRequestSchema>;
