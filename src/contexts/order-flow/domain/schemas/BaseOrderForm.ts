import { z } from "zod";
import { ownershipTypes } from "@contexts/sales/domain/schemas/value-objects/Package";
import { dimensionUnits } from "@contexts/shared/domain/schemas/Dimensions";
import { addressSchema } from "@contexts/shared/domain/schemas/address/Address";

// --- Contact with address (sender/recipient) ---

export const contactWithAddressSchema = z.object({
  id: z.string().nullable(),
  name: z.string().min(1, "El nombre es requerido"),
  company: z.string().min(1, "La empresa es requerida"),
  email: z.string().min(1, "El correo es requerido").email("El correo no es válido"),
  phone: z.string().min(1, "El teléfono es requerido"),
  address: addressSchema,
  save: z.boolean(),
});

// --- Base package (shared dimensions) ---

export const basePackageSchema = z.object({
  boxId: z.string().nullable(),
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
  pickupAtAddress: z.boolean(),
  customerSignature: z.string().nullable(),
  shippingService: z.object({
    currency: z.string(),
    costBreakdown: costBreakdownSchema,
  }),
});

export type BaseOrderFormValues = z.infer<typeof baseOrderFormSchema>;
