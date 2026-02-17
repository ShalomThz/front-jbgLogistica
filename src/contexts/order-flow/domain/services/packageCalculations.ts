import type { PackageFormData, ShippingServiceState } from "../schemas/NewOrderForm";

export const calculateVolumetricWeight = (pkg: PackageFormData) => {
  const l = parseFloat(pkg.length) || 0;
  const w = parseFloat(pkg.width) || 0;
  const h = parseFloat(pkg.height) || 0;
  return (l * w * h) / 5000;
};

export const calculateBillableWeight = (pkg: PackageFormData) => {
  const actualWeight = parseFloat(pkg.weight) || 0;
  const volumetricWeight = calculateVolumetricWeight(pkg);
  return Math.max(actualWeight, volumetricWeight);
};

export const calculateTotal = (shippingService: ShippingServiceState) => {
  const shippingPrice = shippingService.selectedRate?.price.amount || 0;
  const sosPrice = shippingService.sosProtection ? 14.0 : 0;
  return shippingPrice + sosPrice;
};
