import {
  priceTypes,
  serviceLevels,
  shippingModes,
} from "@contexts/pricing/domain/schemas/tariff/Tariff";
import { moneySchema } from "@contexts/shared/domain/schemas/Money";
import { weightUnits } from "@contexts/shared/domain/schemas/Weight";
import { z } from "zod";

/**
 * Una tarifa que cobra **por peso**, no por caja.
 *
 * Vive aparte de `Tariff` porque son dos cosas distintas: aquélla le pone un
 * precio total a una caja y el peso no participa —"cajas sin límite de peso"—,
 * y ésta le pone un precio por unidad de peso a un envío que no tiene caja. Por
 * eso acá no hay `boxId`.
 *
 * El peso que se cobra es siempre el mayor entre el real y el volumétrico, con
 * piso en `minWeight`. No es configurable: es lo que hacen todas las filas que
 * existen.
 */
export const weightRateSchema = z.object({
  id: z.string(),
  zoneId: z.string(),
  destinationCountry: z.string(),
  serviceLevel: z.enum(serviceLevels),
  shippingMode: z.enum(shippingModes),
  priceType: z.enum(priceTypes),
  /** Por unidad de peso, no total. Es la diferencia de fondo con `Tariff`. */
  pricePerUnit: moneySchema,
  /** Unidad de `pricePerUnit`, `minWeight` y `maxWeight`. Una sola para toda la
   * fila: un precio por libra con un mínimo en kilos no significa nada. */
  unit: z.enum(weightUnits),
  minWeight: z.number(),
  /** `null` es sin techo. Superarlo no bloquea: avisa. */
  maxWeight: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type WeightRatePrimitives = z.infer<typeof weightRateSchema>;

export const weightRatesResponseSchema = z.array(weightRateSchema);

/** El alta. `maxWeight` es nulable pero **no opcional**: sin techo se manda
 * `null`, y omitirlo es un error — así no se confunde "sin techo" con "me
 * olvidé de cargarlo". */
export const createWeightRateSchema = weightRateSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateWeightRateRequest = z.infer<typeof createWeightRateSchema>;

/** La edición: lo que no viaja no se toca. */
export type UpdateWeightRateRequest = Partial<CreateWeightRateRequest>;
