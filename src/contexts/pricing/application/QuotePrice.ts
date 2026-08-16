import { z } from "zod";
import { moneySchema } from "@contexts/shared/domain/schemas/Money";
import { serviceLevels, priceTypes } from "@contexts/pricing/domain/schemas/tariff/Tariff";

// Dónde se recoge la caja. Es lo que determina la zona, y por lo tanto el
// precio: el negocio cobra por ir a buscarla, no por llevarla.
export const pickupPointSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("PARTNER_STORE"), storeId: z.string() }),
  z.object({ kind: z.literal("COUNTER_DROPOFF"), storeId: z.string() }),
  // El domicilio no determina la zona (un estado se divide en varias), así que
  // viaja la que eligió el operador.
  z.object({ kind: z.literal("PUBLIC_ADDRESS"), zoneId: z.string() }),
]);

export type PickupPoint = z.infer<typeof pickupPointSchema>;

export const PickupPoints = {
  atPartnerStore: (storeId: string): PickupPoint => ({ kind: "PARTNER_STORE", storeId }),
  atCounter: (storeId: string): PickupPoint => ({ kind: "COUNTER_DROPOFF", storeId }),
  atCustomerAddress: (zoneId: string): PickupPoint => ({ kind: "PUBLIC_ADDRESS", zoneId }),
};

export const quotePriceRequestSchema = z.object({
  pickup: pickupPointSchema,
  boxId: z.string(),
  serviceLevel: z.enum(serviceLevels),
  priceType: z.enum(priceTypes),
});

export type QuotePriceRequest = z.infer<typeof quotePriceRequestSchema>;

// La cotización viaja explicada: con qué zona y qué renglón de la tabla se
// resolvió, y por qué esa zona.
export const quotePriceResponseSchema = z.object({
  price: moneySchema,
  zoneId: z.string(),
  tariffId: z.string(),
  serviceLevel: z.enum(serviceLevels),
  priceType: z.enum(priceTypes),
  resolvedFrom: z.enum(["PARTNER_STORE", "COUNTER_DROPOFF", "PUBLIC_ADDRESS"]),
});

export type QuotePriceResponse = z.infer<typeof quotePriceResponseSchema>;
