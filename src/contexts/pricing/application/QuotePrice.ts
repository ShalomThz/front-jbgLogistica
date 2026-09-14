import { z } from "zod";
import {
  dimensionsSchema,
  type DimensionsPrimitives,
} from "@contexts/shared/domain/schemas/Dimensions";
import { moneySchema } from "@contexts/shared/domain/schemas/Money";
import {
  weightSchema,
  type WeightPrimitives,
} from "@contexts/shared/domain/schemas/Weight";
import {
  serviceLevels,
  priceTypes,
  shippingModes,
} from "@contexts/pricing/domain/schemas/tariff/Tariff";

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

export type Weight = WeightPrimitives;
export type Dimensions = DimensionsPrimitives;

export const quotePriceRequestSchema = z.object({
  pickup: pickupPointSchema,
  destinationCountry: z.string(),
  boxId: z.string(),
  serviceLevel: z.enum(serviceLevels),
  shippingMode: z.enum(shippingModes),
  priceType: z.enum(priceTypes),
  /** El bulto, para los servicios que cobran por peso. Opcionales: el alta de
   * orden de socio no pesa la caja, así que no los manda y no recibe filas por
   * peso. La ausencia del dato es el filtro, no un `if` por tipo de orden. */
  weight: weightSchema.optional(),
  dimensions: dimensionsSchema.optional(),
});

export type QuotePriceRequest = z.infer<typeof quotePriceRequestSchema>;

/**
 * Cómo se llegó al monto cuando se cobró por peso. `null` en las planas.
 *
 * Viene calculado del servidor y no se rehace acá: la cuenta depende del
 * divisor configurado en ajustes, y dos implementaciones de la misma fórmula se
 * desincronizan — `packageCalculations` ya tenía una con el divisor escrito a
 * mano, y no era el que usa el cobro.
 */
export const weightBreakdownSchema = z.object({
  realWeight: weightSchema,
  volumetricWeight: weightSchema,
  /** El mayor de los dos, con el piso de la fila ya aplicado. */
  billableWeight: weightSchema,
  pricePerUnit: moneySchema,
  /** Con qué divisor se sacó el volumétrico. La orden lo guarda porque es un
   * ajuste global que puede cambiar, y sin él la cuenta no se rehace. */
  volumetricDivisor: z.object({
    value: z.number(),
    basis: z.enum(["in3/lb", "cm3/kg"]),
  }),
  /** Pasó el techo de la fila. Es un aviso, no un bloqueo. */
  exceedsMaximum: z.boolean(),
});

export type WeightBreakdown = z.infer<typeof weightBreakdownSchema>;

// La cotización viaja explicada: con qué zona y qué renglón de la tabla se
// resolvió, y por qué esa zona.
export const quotePriceResponseSchema = z.object({
  price: moneySchema,
  zoneId: z.string(),
  destinationCountry: z.string(),
  tariffId: z.string(),
  serviceLevel: z.enum(serviceLevels),
  shippingMode: z.enum(shippingModes),
  priceType: z.enum(priceTypes),
  resolvedFrom: z.enum(["PARTNER_STORE", "COUNTER_DROPOFF", "PUBLIC_ADDRESS"]),
  /** `FLAT` es el total de una caja; `PER_WEIGHT`, peso facturable por el
   * precio unitario. Con default, para que una respuesta anterior al campo se
   * lea como lo que era. */
  source: z.enum(["FLAT", "PER_WEIGHT"]).default("FLAT"),
  weightBreakdown: weightBreakdownSchema.nullish().default(null),
});

export type QuotePriceResponse = z.infer<typeof quotePriceResponseSchema>;

/** La misma pregunta sin los dos ejes que elige el vendedor: la respuesta es el
 * menú de esas combinaciones, que es lo que pinta la tabla de selección. */
export const quotePriceOptionsRequestSchema = quotePriceRequestSchema.omit({
  serviceLevel: true,
  shippingMode: true,
});

export type QuotePriceOptionsRequest = z.infer<
  typeof quotePriceOptionsRequestSchema
>;

export const quotePriceOptionsResponseSchema = z.object({
  options: z.array(quotePriceResponseSchema),
});

export type QuotePriceOptionsResponse = z.infer<
  typeof quotePriceOptionsResponseSchema
>;
