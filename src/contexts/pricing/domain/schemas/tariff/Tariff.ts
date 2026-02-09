import { z } from "zod";
import { aggregateRootSchema, moneySchema } from "@/shared/domain";
import { countryCodeSchema } from "./CountryCode";
export const tariffSchema = z.object({
  id: z.string(),
  originZoneId: z.string(),
  destinationCountry: countryCodeSchema,
  boxId: z.string(),
  price: moneySchema,
  ...aggregateRootSchema.shape,
});

export type TariffPrimitives = z.infer<typeof tariffSchema>;

// CREATE TARIFF USE CASE
export const createTariffRequestSchema = tariffSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
