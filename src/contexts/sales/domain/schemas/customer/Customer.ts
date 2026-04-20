import { aggregateRootSchema } from "@contexts/shared/domain/schemas/AggregateRoot";
import { addressSchema, createAddressSchema } from "@contexts/shared/domain/schemas/address/Address";
import { emailSchema } from "@contexts/shared/domain/schemas/Email";
import { z } from "zod";

// Schema permisivo para parsear respuestas del API
export const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  company: z.string(),
  email: z.string(),
  phone: z.string(),
  registeredByStoreId: z.string(),
  address: addressSchema,
  userId: z.string().nullable(),
  ...aggregateRootSchema.shape,
});

export type CustomerPrimitives = z.infer<typeof customerSchema>;

// Schema estricto solo para el formulario de crear/editar
export const createCustomerSchema = z.object({
  userId: z.string().nullable(),
  registeredByStoreId: z.string().min(1, "Selecciona una tienda"),
  name: z.string().min(1, "El nombre es requerido").trim().min(1, "El nombre no puede ser solo espacios").max(100, "Máximo 100 caracteres"),
  company: z.string().min(1, "La empresa es requerida").trim().min(1, "La empresa no puede ser solo espacios").max(100, "Máximo 100 caracteres"),
  email: emailSchema,
  phone: z.string()
    .min(1, "El teléfono es requerido")
    .regex(/^\+?[0-9]{7,15}$/, "El teléfono solo puede contener números (7-15 dígitos)"),
  address: createAddressSchema,
});

export type CreateCustomerRequest = z.infer<typeof createCustomerSchema>;
