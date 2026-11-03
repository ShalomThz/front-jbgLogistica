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

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Debe ser un color hex de 6 dígitos (#RRGGBB)");

// Cómo se ve la etiqueta "Agente" de esta tienda (logo y colores del banner de
// tracking / bloque de C.P.). La etiqueta "cargo" de JBG no lee este campo.
export const agentLabelBrandingSchema = z.object({
  logo: z.string().min(1).nullable().default(null),
  primaryColor: hexColorSchema.nullable().default(null),
  secondaryColor: hexColorSchema.nullable().default(null),
});

export type AgentLabelBrandingPrimitives = z.infer<
  typeof agentLabelBrandingSchema
>;

// Logo y colores de la factura que esta tienda (si es socio) le entrega a su
// propio cliente. La factura "jbg" no lee este campo.
export const partnerInvoiceBrandingSchema = z.object({
  logo: z.string().min(1).nullable().default(null),
  primaryColor: hexColorSchema.nullable().default(null),
  accentColor: hexColorSchema.nullable().default(null),
});

export type PartnerInvoiceBrandingPrimitives = z.infer<
  typeof partnerInvoiceBrandingSchema
>;

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
  agentLabelBranding: agentLabelBrandingSchema.default({
    logo: null,
    primaryColor: null,
    secondaryColor: null,
  }),
  invoiceBranding: partnerInvoiceBrandingSchema.default({
    logo: null,
    primaryColor: null,
    accentColor: null,
  }),
  ...aggregateRootSchema.shape,
});

export type StorePrimitives = z.infer<typeof storeSchema>;
