import type { PackageFormData } from "../domain/schemas/NewOrderForm";

export const buildPackagePayload = (packageData: PackageFormData) => ({
  boxId: packageData.boxId,
  ownership: packageData.ownership,
  weight: {
    value: parseFloat(packageData.weight) || 0,
    unit: "kg" as const,
  },
  dimensions: {
    length: parseFloat(packageData.length) || 0,
    width: parseFloat(packageData.width) || 0,
    height: parseFloat(packageData.height) || 0,
    unit: packageData.dimensionUnit,
  },
});
