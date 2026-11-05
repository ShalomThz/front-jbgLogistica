import type { DimensionsPrimitives } from "@contexts/shared/domain/schemas/Dimensions";

const CM_PER_IN = 2.54;

export const DEFAULT_LINEAR_FEET_DIVISOR = 123000;

/**
 * Pies lineales sugeridos para una caja: alto × largo × ancho (en pulgadas)
 * entre el divisor del consolidado. Las dimensiones de la orden pueden venir
 * en cm — se convierten a pulgadas antes de dividir, porque el divisor por
 * default (123,000) sólo tiene sentido con volumen en pulgadas cúbicas.
 *
 * Es sólo una sugerencia: el campo de pies lineales siempre se puede editar
 * a mano después, igual que hoy.
 */
export function calculateLinearFeet(
  dimensions: DimensionsPrimitives,
  divisor: number,
): number {
  const toInches = dimensions.unit === "cm" ? 1 / CM_PER_IN : 1;
  const volumeIn3 =
    dimensions.length * toInches * (dimensions.width * toInches) * (dimensions.height * toInches);
  return Math.round((volumeIn3 / divisor) * 10) / 10;
}
