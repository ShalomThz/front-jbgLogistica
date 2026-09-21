import { customerSchema } from "@contexts/sales/domain/schemas/customer/Customer";
import { createAddressSchema } from "@contexts/shared/domain/schemas/address/Address";
import { z } from "zod";

export const createCustomerRequestSchema = customerSchema
  .omit({
    id: true,
    customerNumber: true,
    photo: true,
    createdAt: true,
    updatedAt: true,
    address: true,
  })
  .extend({
    // Opcional. El input manda "" cuando no hay foto, y se omite en vez de
    // viajar vacía: al editar, omitirla es como el back dice "dejá la que está",
    // y mandar "" daría 400 porque su unión pide `min(1)` en las dos ramas.
    photo: z
      .string()
      .max(10 * 1024 * 1024, "La fotografía del cliente es demasiado grande")
      .optional()
      .transform((value) => value || undefined),
    registeredByStoreId: z.string().min(1, "Tienda es requerida"),
    address: createAddressSchema,
  });

export type CreateCustomerRequest = z.infer<typeof createCustomerRequestSchema>;
