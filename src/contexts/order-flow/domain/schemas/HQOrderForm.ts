import { z } from "zod";
import type { RatePrimitives } from "@contexts/shipping/domain/schemas/value-objects/Rate";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import { weightUnits } from "@contexts/shared/domain/schemas/Weight";

import { baseOrderFormSchema, basePackageSchema } from "./BaseOrderForm";

// --- HQ package (full: base + weight + product type + consignment) ---

const hqPackageSchema = basePackageSchema.extend({
  productSearch: z.string(),
  weight: z.string().refine((v) => parseFloat(v) > 0, "El peso debe ser mayor a 0"),
  weightUnit: z.enum(weightUnits),
  productType: z.string(),
  savePackage: z.boolean(),
  skydropxCategoryId: z.string(),
  skydropxSubcategoryId: z.string(),
  consignmentNoteClassCode: z.string().min(1, "La clase es requerida"),
  consignmentNotePackagingCode: z.string().min(1, "El empaque es requerido"),
}).superRefine((data, ctx) => {
  if (data.weightUnit === "lb" && parseFloat(data.weight) < 2) {
    ctx.addIssue({
      code: "custom",
      message: "El peso debe ser mayor a 1 lb",
      path: ["weight"],
    });
  }
});

// --- HQ form ---

export const hqOrderFormSchema = baseOrderFormSchema.extend({
  orderType: z.literal("HQ"),
  package: hqPackageSchema,
  shippingService: baseOrderFormSchema.shape.shippingService.extend({
    selectedRate: z.custom<RatePrimitives>().nullable(),
    tariff: z.custom<MoneyPrimitives>().nullable(),
  }),
}).superRefine((data, ctx) => {
  if (!data.orderData.orderNumber.trim()) {
    ctx.addIssue({
      code: "custom",
      message: "El número de orden es requerido",
      path: ["orderData", "orderNumber"],
    });
  }
});

export type HQOrderFormValues = z.infer<typeof hqOrderFormSchema>;
export type HQPackageFormData = HQOrderFormValues["package"];
export type HQShippingServiceState = HQOrderFormValues["shippingService"];
