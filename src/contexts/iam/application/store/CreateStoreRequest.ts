import { z } from "zod";
import { storeSchema, storeTypes } from "@contexts/iam/domain/schemas/store/Store";

const MAX_LOGO_LENGTH = 10 * 1024 * 1024;

// Solo JPEG/PNG: el logo se dibuja con pdfkit en el backend, que no soporta
// WebP — a diferencia de la foto del cliente, que solo se muestra en pantalla.
export const agentLabelLogoUploadSchema = z
  .string()
  .max(MAX_LOGO_LENGTH, "El logo es demasiado grande")
  .regex(
    /^data:image\/(?:jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$/,
    "El logo debe ser una imagen JPEG o PNG",
  );

export const partnerInvoiceLogoUploadSchema = z
  .string()
  .max(MAX_LOGO_LENGTH, "El logo es demasiado grande")
  .regex(
    /^data:image\/(?:jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$/,
    "El logo debe ser una imagen JPEG o PNG",
  );

const hexColorFormSchema = z
  .string()
  .transform((value) => value.trim() || null)
  .pipe(
    z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Debe ser un color hex de 6 dígitos (#RRGGBB)")
      .nullable(),
  );

export const createStoreRequestSchema = storeSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    agentLabelBranding: true,
    invoiceBranding: true,
  })
  .extend({
    // Sin el `default` de storeSchema: aquél existe para leer documentos
    // anteriores al campo, no para que dar de alta una tienda sin tipo la
    // vuelva socia por omisión.
    type: z.enum(storeTypes),
    // El formulario siempre manda las tres llaves como string ("" = sin
    // valor); acá se normalizan. El logo puede llegar vacío (sin cambios / sin
    // logo todavía), como un archivo nuevo (data URL) o como la clave ya
    // guardada — igual que la foto del cliente.
    agentLabelBranding: z.object({
      logo: z
        .string()
        .optional()
        .transform((value) => value || undefined)
        .pipe(
          z
            .union([agentLabelLogoUploadSchema, z.string().min(1).max(255)])
            .optional(),
        ),
      primaryColor: hexColorFormSchema,
      secondaryColor: hexColorFormSchema,
    }),
    invoiceBranding: z.object({
      logo: z
        .string()
        .optional()
        .transform((value) => value || undefined)
        .pipe(
          z
            .union([partnerInvoiceLogoUploadSchema, z.string().min(1).max(255)])
            .optional(),
        ),
      primaryColor: hexColorFormSchema,
      accentColor: hexColorFormSchema,
    }),
  });

export type CreateStoreRequestPrimitives = z.infer<
  typeof createStoreRequestSchema
>;

export const editStoreInvoiceBrandingSchema = z.object({
  invoiceBranding: z.object({
    logo: z
      .string()
      .optional()
      .transform((value) => value || undefined)
      .pipe(
        z
          .union([partnerInvoiceLogoUploadSchema, z.string().min(1).max(255)])
          .optional(),
      ),
    primaryColor: hexColorFormSchema,
    accentColor: hexColorFormSchema,
  }),
});

export type EditStoreInvoiceBrandingPrimitives = z.infer<
  typeof editStoreInvoiceBrandingSchema
>;

export const editStoreAgentLabelBrandingSchema = z.object({
  agentLabelBranding: z.object({
    logo: z
      .string()
      .optional()
      .transform((value) => value || undefined)
      .pipe(
        z
          .union([agentLabelLogoUploadSchema, z.string().min(1).max(255)])
          .optional(),
      ),
    primaryColor: hexColorFormSchema,
    secondaryColor: hexColorFormSchema,
  }),
});

export type EditStoreAgentLabelBrandingPrimitives = z.infer<
  typeof editStoreAgentLabelBrandingSchema
>;
