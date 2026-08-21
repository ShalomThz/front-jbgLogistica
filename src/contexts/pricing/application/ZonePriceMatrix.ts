import { z } from "zod";
import { boxSchema } from "@contexts/inventory/domain/schemas/box/Box";
import { moneySchema } from "@contexts/shared/domain/schemas/Money";
import {
  serviceLevels,
  shippingModes,
} from "@contexts/pricing/domain/schemas/tariff/Tariff";
import { zoneSchema } from "@contexts/pricing/domain/schemas/zone/Zone";

const priceCellSchema = z.object({ tariffId: z.string(), price: moneySchema });

/**
 * La zona vista como tabla, para un modo de transporte: caja × servicio con los
 * dos precios. Es como la lee quien la usa —un vendedor cambia de zona y ve
 * todo de un vistazo— y hace visibles los huecos: una celda vacía es una tarifa
 * que falta.
 *
 * El modo va arriba y no como tercer eje: caja × servicio × modo daría doce
 * columnas por caja.
 */
export const zonePriceCellSchema = z.object({
  serviceLevel: z.enum(serviceLevels),
  public: priceCellSchema.nullable(),
  partner: priceCellSchema.nullable(),
});

export const zonePriceRowSchema = z.object({
  box: boxSchema,
  cells: z.array(zonePriceCellSchema),
});

export const zonePriceMatrixSchema = z.object({
  zone: zoneSchema,
  destinationCountry: z.string(),
  shippingMode: z.enum(shippingModes),
  rows: z.array(zonePriceRowSchema),
});

export type ZonePriceCell = z.infer<typeof zonePriceCellSchema>;
export type ZonePriceRow = z.infer<typeof zonePriceRowSchema>;
export type ZonePriceMatrix = z.infer<typeof zonePriceMatrixSchema>;

export const setZonePriceRequestSchema = z.object({
  zoneId: z.string(),
  destinationCountry: z.string(),
  boxId: z.string(),
  serviceLevel: z.enum(serviceLevels),
  shippingMode: z.enum(shippingModes),
  // null borra la fila: es como se deja una combinación sin precio, que no es
  // lo mismo que cobrar cero.
  publicPrice: moneySchema.nullable(),
  partnerPrice: moneySchema.nullable(),
});

export type SetZonePriceRequest = z.infer<typeof setZonePriceRequestSchema>;
