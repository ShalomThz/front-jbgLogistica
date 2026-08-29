import { aggregateRootSchema } from "@contexts/shared/domain/schemas/AggregateRoot";
import { addressSchema, createAddressSchema } from "@contexts/shared/domain/schemas/address/Address";
import { optionalEmailSchema } from "@contexts/shared/domain/schemas/Email";
import { z } from "zod";

export const customerSchema = z.object({
  id: z.string(),
  customerNumber: z.number().int().positive(),
  photo: z.string().min(1).nullable().default(null),
  name: z.string().min(1, "Customer name is required"),
  company: z.string().min(3, "Company must be at least 3 characters"),
  email: optionalEmailSchema,
  phone: z.string().min(1, "Phone number is required"),
  /** Teléfono de respaldo, opcional. El input manda `""` cuando queda vacío y
   * el back exige `min(1)` o `null`, así que la normalización va acá y no en el
   * formulario: son tres pantallas distintas las que abren el diálogo. */
  secondaryPhone: z
    .string()
    .nullish()
    .transform((value) => value?.trim() || null),
  registeredByStoreId: z.string(),
  address: addressSchema,
  userId: z.string().nullable(),
  ...aggregateRootSchema.shape,
});

export type CustomerPrimitives = z.infer<typeof customerSchema>;

export const createCustomerSchema = customerSchema.omit({
  id: true,
  customerNumber: true,
  photo: true,
  createdAt: true,
  updatedAt: true,
  address: true,
}).extend({
  photo: z.string().min(1, "La fotografía del cliente es requerida"),
  address: createAddressSchema,
});

export type CreateCustomerRequest = z.infer<typeof createCustomerSchema>;
