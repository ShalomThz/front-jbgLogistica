import { z } from "zod";
import { ownershipTypes } from "@contexts/sales/domain/schemas/value-objects/Package";
import { dimensionUnits } from "@contexts/shared/domain/schemas/Dimensions";
import { createAddressSchema } from "@contexts/shared/domain/schemas/address/Address";
import { optionalEmailSchema } from "@contexts/shared/domain/schemas/Email";

// --- Contact with address (sender/recipient) ---

export const contactWithAddressSchema = z.object({
  id: z.string().nullable(),
  customerNumber: z.number().nullable().optional(),
  name: z.string().min(1, "El nombre es requerido"),
  company: z.string().min(3, "La empresa debe tener al menos 3 caracteres"),
  email: optionalEmailSchema,
  phone: z.string().min(1, "El teléfono es requerido").max(20, "Máximo 20 caracteres"),
  address: createAddressSchema,
  save: z.boolean(),
});

// --- Base package (shared dimensions) ---

export const basePackageSchema = z.object({
  boxId: z.string().min(1, "Selecciona una caja"),
  ownership: z.enum(ownershipTypes),
  packageType: z.string(),
  length: z.string().refine((v) => parseFloat(v) > 0, "El largo debe ser mayor a 0"),
  width: z.string().refine((v) => parseFloat(v) > 0, "El ancho debe ser mayor a 0"),
  height: z.string().refine((v) => parseFloat(v) > 0, "El alto debe ser mayor a 0"),
  dimensionUnit: z.enum(dimensionUnits),
});

// --- Cost breakdown ---

export const costBreakdownSchema = z.object({
  insurance: z.string(),
  tools: z.string(),
  additionalCost: z.string(),
  wrap: z.string(),
  tape: z.string(),
});

// --- Base form (shared between HQ and Partner) ---

export const baseOrderFormSchema = z.object({
  orderData: z.object({
    orderNumber: z.string(),
    partnerOrderNumber: z.string(),
  }),
  sender: contactWithAddressSchema,
  recipient: contactWithAddressSchema,
  package: basePackageSchema,
  /** "Dejar caja vacía a domicilio": el chofer la deja y luego la recolecta. */
  emptyBoxDelivery: z.boolean(),
  /** Anticipo cobrado al solicitar la caja vacía (monto libre). */
  advanceAmount: z.string(),
  customerSignature: z.string().nullable(),
  shippingService: z.object({
    currency: z.string(),
    costBreakdownCurrency: z.string(),
    costBreakdown: costBreakdownSchema,
    discount: z.object({
      amount: z.string(),
      currency: z.string(),
      concept: z.string(),
    }),
  }),
});

export type BaseOrderFormValues = z.infer<typeof baseOrderFormSchema>;
