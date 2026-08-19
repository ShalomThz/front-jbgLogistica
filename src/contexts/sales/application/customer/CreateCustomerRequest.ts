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
    photo: z
      .string()
      .min(1, "La fotografía del cliente es requerida")
      .max(10 * 1024 * 1024, "La fotografía del cliente es demasiado grande"),
    registeredByStoreId: z.string().min(1, "Tienda es requerida"),
    address: createAddressSchema,
  });

export type CreateCustomerRequest = z.infer<typeof createCustomerRequestSchema>;
