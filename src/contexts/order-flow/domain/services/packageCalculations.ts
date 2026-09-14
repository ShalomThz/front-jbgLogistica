import type { HQPackageFormData, HQShippingServiceState } from "../schemas/NewOrderForm";
import type { ShippingMode } from "@contexts/shipping/domain/schemas/shipment/ShippingModes";

const LB_TO_KG = 0.453592;
const IN_TO_CM = 2.54;

/**
 * Divisor **solo para la vista previa** del paso de paquete, antes de que haya
 * una cotización.
 *
 * El que decide el cobro vive en Ajustes y lo aplica el servidor: éste es una
 * referencia para que la pantalla no quede vacía mientras se cargan las
 * medidas. Si los dos difieren, manda el del servidor — por eso
 * `ShipmentSummaryCard` muestra el peso facturable que vino en la cotización y
 * no éste.
 */
const PREVIEW_VOLUMETRIC_DIVISOR = 5000;

/** Peso masa en kg, sea cual sea la unidad capturada. */
export const calculateMassWeight = (pkg: HQPackageFormData) => {
  const value = parseFloat(pkg.weight) || 0;
  return pkg.weightUnit === "lb" ? value * LB_TO_KG : value;
};

/** Peso volumétrico en kg, aproximado. Ver {@link PREVIEW_VOLUMETRIC_DIVISOR}. */
export const calculateVolumetricWeight = (pkg: HQPackageFormData) => {
  const m = pkg.dimensionUnit === "in" ? IN_TO_CM : 1;
  const l = (parseFloat(pkg.length) || 0) * m;
  const w = (parseFloat(pkg.width) || 0) * m;
  const h = (parseFloat(pkg.height) || 0) * m;
  return (l * w * h) / PREVIEW_VOLUMETRIC_DIVISOR;
};

/**
 * Peso a cotizar en kg, aproximado. Solo el aéreo cobra por el mayor entre masa
 * y volumen; terrestre y marítimo cotizan el peso real.
 *
 * **No es el número que se cobra.** Ese lo devuelve la cotización en
 * `weightBreakdown.billableWeight`, calculado con el divisor configurado y con
 * el piso de la fila aplicado. Esto es lo que se muestra mientras todavía no
 * hay cotización.
 */
export const calculateBillableWeight = (
  pkg: HQPackageFormData,
  mode: ShippingMode,
) => {
  const massWeight = calculateMassWeight(pkg);

  return mode === "AIR"
    ? Math.max(massWeight, calculateVolumetricWeight(pkg))
    : massWeight;
};

export const calculateTotal = (shippingService: HQShippingServiceState) => {
  const shippingPrice = shippingService.selectedRate?.price.amount || 0;
  const { insurance, tools, additionalCost, wrap, tape } = shippingService.costBreakdown;
  const breakdownTotal = [insurance, tools, additionalCost, wrap, tape]
    .reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  return shippingPrice + breakdownTotal;
};
