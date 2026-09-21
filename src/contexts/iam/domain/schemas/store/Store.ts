import { z } from "zod";
import { emailSchema} from "@contexts/shared/domain/schemas/Email";
import { addressSchema } from "@contexts/shared/domain/schemas/address/Address";
import { aggregateRootSchema } from "@contexts/shared/domain/schemas/AggregateRoot";

// PARTNER son las tiendas socias; JBG las distribuidoras, las que prestan el
// servicio de recolección. El tipo decide qué columna de la tarifa se cobra.
export const storeTypes = ["PARTNER", "JBG"] as const;

export type StoreType = (typeof storeTypes)[number];

export const STORE_TYPE_LABELS: Record<StoreType, string> = {
  PARTNER: "Socio",
  JBG: "Distribuidora JBG",
};

export const storeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Store name is required"),
  // Los documentos anteriores al campo se leen como PARTNER. `nullish` y no
  // `default` porque la tienda viaja embebida en vistas que son fotos: el campo
  // puede faltar o venir en null, y `default` solo cubre lo primero.
  type: z
    .enum(storeTypes)
    .nullish()
    .transform((value) => value ?? "PARTNER"),
  zoneId: z.string(),
  address: addressSchema,
  phone: z.string().min(1, "Phone number is required"),
  contactEmail: emailSchema,
  ...aggregateRootSchema.shape,
});

export type StorePrimitives = z.infer<typeof storeSchema>;
