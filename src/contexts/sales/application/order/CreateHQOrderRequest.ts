import { customerProfileSchema } from "@contexts/sales/domain/schemas/value-objects/CustomerProfile";
import { orderReferencesSchema } from "@contexts/sales/domain/schemas/value-objects/OrderReferences";
import { packageSchema } from "@contexts/sales/domain/schemas/value-objects/Package";
import { createAddressSchema } from "@contexts/shared/domain/schemas/address/Address";
import z from "zod";

export const createHQOrderSchema = z.object({
  storeId: z.string(),
  references: orderReferencesSchema,
  package: packageSchema,
  origin: z.object({
    ...customerProfileSchema.shape,
    address: createAddressSchema,
  }),
  destination: z.object({
    ...customerProfileSchema.shape,
    address: createAddressSchema,
  }),
  customerSignature: z.string().nullable(),
  /** La nota de la factura. Declarada acá porque este esquema es un espejo del
   * del back: si faltara, `.parse()` la borraría en silencio y `tsc` no vería
   * nada. */
  notes: z.string().nullish(),
});

export type CreateHQOrderRequest = z.infer<typeof createHQOrderSchema>;
