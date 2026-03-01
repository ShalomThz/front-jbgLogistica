import { z } from "zod";

export const skydropxAddressFromSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  company: z.string(),
  email: z.email("Email inválido"),
  phone: z.string().min(1, "Teléfono requerido"),
  address1: z.string().min(1, "Dirección requerida"),
  address2: z.string(),
  city: z.string().min(1, "Ciudad requerida"),
  province: z.string().min(1, "Estado requerido"),
  zip: z.string().min(1, "Código postal requerido"),
  country: z.string().min(1, "País requerido"),
});

export type SkydropxAddressFromPrimitives = z.infer<typeof skydropxAddressFromSchema>;

export const getSkydropxAddressResponseSchema = z.object({
  skydropxAddressFrom: skydropxAddressFromSchema.nullable(),
});

export type GetSkydropxAddressResponse = z.infer<typeof getSkydropxAddressResponseSchema>;
