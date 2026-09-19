import type { HQPackageFormData, HQShippingServiceState } from "../schemas/NewOrderForm";
import type { ShippingMode } from "@contexts/shipping/domain/schemas/shipment/ShippingModes";
import type { VolumetricDivisor } from "@contexts/settings/application/VolumetricDivisor";
import { weightRateShippingModes } from "@contexts/pricing/domain/schemas/tariff/Tariff";

const LB_TO_KG = 0.453592;
const IN_TO_CM = 2.54;
/** Centímetros cúbicos en una pulgada cúbica (2.54³). El volumen siempre se
 * calcula en cm³ y el divisor puede venir en in³/lb. */
const CM3_PER_IN3 = 16.387064;

/**
 * El divisor de mientras: el mismo que asume el back cuando Ajustes está vacío
 * (`LEGACY_VOLUMETRIC_DIVISOR`), para que la pantalla no quede muda durante la
 * llamada.
 *
 * Antes era el divisor **fijo** de la vista previa, y ahí estaba el problema: si
 * en Ajustes había 166 in³/lb, la pantalla del paso de paquete mostraba un 20%
 * de más y el número recién se corregía en el paso siguiente, sin nada que lo
 * explicara.
 */
export const FALLBACK_VOLUMETRIC_DIVISOR: VolumetricDivisor = {
  value: 5000,
  basis: "cm3/kg",
};

/**
 * Si este modo mezcla peso real y volumétrico, o cobra el real y nada más.
 *
 * Sale de `weightRateShippingModes` en vez de comparar contra `"AIR"` a mano:
 * esa lista es la que decide qué modos se pueden guardar en `weightRates`, y
 * `WeightRate.billableWeight` toma el mayor en **todos** ellos. Escritas por
 * separado eran dos reglas para lo mismo, y el día que un modo más cobre por
 * peso la vista previa habría seguido mostrando solo la masa mientras el cobro
 * usaba el volumétrico.
 */
const chargesByWeight = (mode: ShippingMode): boolean =>
  (weightRateShippingModes as readonly ShippingMode[]).includes(mode);

/**
 * Peso masa **en la unidad capturada**: es el número que se escribió, tal cual.
 *
 * Todo lo de acá se devuelve en `pkg.weightUnit` y no en kg, para que la
 * pantalla pueda etiquetarlo con la unidad que el usuario eligió. Convertirlo a
 * kg y rotularlo "kg" era correcto pero confuso: el selector decía lb y el
 * número decía otra cosa, sin nada que explicara el salto.
 */
export const calculateMassWeight = (pkg: HQPackageFormData) =>
  parseFloat(pkg.weight) || 0;

/**
 * Peso volumétrico en la unidad capturada, con el divisor de Ajustes.
 *
 * Espeja a `Dimensions.volumetricWeight` del back, incluida la bifurcación por
 * escala: el resultado nace en kg o en lb según cómo esté configurado el
 * divisor, y recién después se pasa a la unidad que se está capturando. Los dos
 * pasos son necesarios — dividir cm³ entre un divisor en in³/lb da un número
 * 16 veces más chico, y sigue pareciendo plausible.
 */
export const calculateVolumetricWeight = (
  pkg: HQPackageFormData,
  divisor: VolumetricDivisor = FALLBACK_VOLUMETRIC_DIVISOR,
) => {
  const m = pkg.dimensionUnit === "in" ? IN_TO_CM : 1;
  const l = (parseFloat(pkg.length) || 0) * m;
  const w = (parseFloat(pkg.width) || 0) * m;
  const h = (parseFloat(pkg.height) || 0) * m;
  const volumeCm3 = l * w * h;

  if (divisor.basis === "cm3/kg") {
    const kg = volumeCm3 / divisor.value;
    return pkg.weightUnit === "lb" ? kg / LB_TO_KG : kg;
  }

  const lb = volumeCm3 / CM3_PER_IN3 / divisor.value;
  return pkg.weightUnit === "kg" ? lb * LB_TO_KG : lb;
};

/**
 * Peso a cotizar en la unidad capturada, aproximado. Solo el aéreo cobra por el
 * mayor entre masa y volumen; terrestre y marítimo cotizan el peso real.
 *
 * **Sigue sin ser el número que se cobra**, aunque ya use el divisor de Ajustes:
 * a la cotización le falta aplicarle el piso de la fila (`minWeight`), que solo
 * se conoce cuando hay una tarifa elegida. Por eso `ShipmentSummaryCard` muestra
 * el `weightBreakdown` de la cotización en cuanto lo tiene.
 */
export const calculateBillableWeight = (
  pkg: HQPackageFormData,
  mode: ShippingMode,
  divisor: VolumetricDivisor = FALLBACK_VOLUMETRIC_DIVISOR,
) => {
  const massWeight = calculateMassWeight(pkg);

  return chargesByWeight(mode)
    ? Math.max(massWeight, calculateVolumetricWeight(pkg, divisor))
    : massWeight;
};

export const calculateTotal = (shippingService: HQShippingServiceState) => {
  const shippingPrice = shippingService.selectedRate?.price.amount || 0;
  const { insurance, tools, additionalCost, wrap, tape } = shippingService.costBreakdown;
  const breakdownTotal = [insurance, tools, additionalCost, wrap, tape]
    .reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  return shippingPrice + breakdownTotal;
};
