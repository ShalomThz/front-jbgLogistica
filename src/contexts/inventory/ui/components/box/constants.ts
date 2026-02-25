import type { DimensionUnit } from "@contexts/shared/domain/schemas/Dimensions";

export const UNIT_LABELS: Record<DimensionUnit, string> = {
  cm: "Centímetros",
  in: "Pulgadas",
};

export const UNIT_SHORT_LABELS: Record<DimensionUnit, string> = {
  cm: "cm",
  in: "pulgadas",
};
