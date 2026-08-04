import type { HQPackageFormData, HQShippingServiceState } from "../schemas/NewOrderForm";
import type { ShippingMode } from "@contexts/shipping/domain/schemas/shipment/ShippingModes";

const LB_TO_KG = 0.453592;
const IN_TO_CM = 2.54;
// Divisor estándar de carga aérea sobre dimensiones en cm.
const VOLUMETRIC_DIVISOR = 5000;

/** Peso masa en kg, sea cual sea la unidad capturada. */
export const calculateMassWeight = (pkg: HQPackageFormData) => {
  const value = parseFloat(pkg.weight) || 0;
  return pkg.weightUnit === "lb" ? value * LB_TO_KG : value;
};

/**
 * Peso volumétrico en kg. Espeja el `Dimensions.calculateVolumetricWeight` del
 * backend: las dimensiones se normalizan a cm antes de dividir, así que el
 * resultado es siempre kg sin importar las unidades del paquete.
 */
export const calculateVolumetricWeight = (pkg: HQPackageFormData) => {
  const m = pkg.dimensionUnit === "in" ? IN_TO_CM : 1;
  const l = (parseFloat(pkg.length) || 0) * m;
  const w = (parseFloat(pkg.width) || 0) * m;
  const h = (parseFloat(pkg.height) || 0) * m;
  return (l * w * h) / VOLUMETRIC_DIVISOR;
};

/**
 * Peso a cotizar en kg. Solo el envío aéreo cobra por el mayor entre masa y
 * volumen; terrestre y marítimo cotizan el peso real.
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
