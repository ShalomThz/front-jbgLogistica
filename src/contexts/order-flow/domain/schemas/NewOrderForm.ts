import { z } from "zod";
import type { RatePrimitives } from "@contexts/shipping/domain/schemas/value-objects/Rate";
import { ownershipTypes } from "@contexts/sales/domain/schemas/value-objects/Package";
import { dimensionUnits } from "@contexts/shared/domain/schemas/Dimensions";
import { weightUnits } from "@contexts/shared/domain/schemas/Weight";
import { orderTypes } from "@contexts/sales/domain/schemas/order/OrderTypes";
import { addressSchema } from "@contexts/shared/domain/schemas/address/Address";

// --- Contact with address (sender/recipient) ---

const contactWithAddressSchema = z.object({
  id: z.string().nullable(),
  name: z.string().min(1, "El nombre es requerido"),
  company: z.string().min(1, "La empresa es requerida"),
  email: z.string().min(1, "El correo es requerido").email("El correo no es válido"),
  phone: z.string().min(1, "El teléfono es requerido"),
  address: addressSchema,
  save: z.boolean(),
});

// --- Package ---

const packageFormDataSchema = z.object({
  productSearch: z.string(),
  boxId: z.string().nullable(),
  ownership: z.enum(ownershipTypes),
  packageType: z.string(),
  length: z.string().refine((v) => parseFloat(v) > 0, "El largo debe ser mayor a 0"),
  width: z.string().refine((v) => parseFloat(v) > 0, "El ancho debe ser mayor a 0"),
  height: z.string().refine((v) => parseFloat(v) > 0, "El alto debe ser mayor a 0"),
  dimensionUnit: z.enum(dimensionUnits),
  weight: z.string().refine((v) => parseFloat(v) > 0, "El peso debe ser mayor a 0"),
  weightUnit: z.enum(weightUnits),
  quantity: z.string(),
  productType: z.string(),
  savePackage: z.boolean(),
  skydropxCategoryId: z.string(),
  skydropxSubcategoryId: z.string(),
  consignmentNoteClassCode: z.string().min(1, "La clase es requerida"),
  consignmentNotePackagingCode: z.string().min(1, "El empaque es requerido"),
});

// --- Shipping service ---

const shippingServiceSchema = z.object({
  selectedRate: z.custom<RatePrimitives>().nullable(),
  currency: z.string(),
  costBreakdown: z.object({
    insurance: z.string(),
    tools: z.string(),
    additionalCost: z.string(),
    wrap: z.string(),
    tape: z.string(),
  }),
});

// --- Full form ---

export const newOrderFormSchema = z
  .object({
    orderType: z.enum(orderTypes),
    orderData: z.object({
      orderNumber: z.string().min(1, "El número de orden es requerido"),
      partnerOrderNumber: z.string(),
    }),
    sender: contactWithAddressSchema,
    recipient: contactWithAddressSchema,
    package: packageFormDataSchema,
    shippingService: shippingServiceSchema,
  })
  .superRefine((data, ctx) => {
    if (data.orderType === "PARTNER" && !data.orderData.partnerOrderNumber.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El número de socio es requerido para órdenes Partner",
        path: ["orderData", "partnerOrderNumber"],
      });
    }
  });

export type NewOrderFormValues = z.infer<typeof newOrderFormSchema>;
export type PackageFormData = NewOrderFormValues["package"];
export type ShippingServiceState = NewOrderFormValues["shippingService"];
