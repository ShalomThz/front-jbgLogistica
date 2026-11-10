import { z } from "zod";
import { aggregateRootSchema } from "@contexts/shared/domain/schemas/AggregateRoot";
import { paginationSchema } from "@contexts/shared/domain/schemas/Pagination";

export const trailerSchema = z.object({
  id: z.string(),
  unitNumber: z.string().min(1, "La unidad es requerida"),
  type: z.string().min(1, "El tipo de tráiler es requerido"),
  plates: z.string().min(1, "Las placas son requeridas"),
  capacityLinearFeet: z.number().positive("La capacidad debe ser mayor a 0"),
  isActive: z.boolean(),
  ...aggregateRootSchema.shape,
});

export type TrailerPrimitives = z.infer<typeof trailerSchema>;

export const createTrailerRequestSchema = z.object({
  unitNumber: z.string().min(1, "La unidad es requerida"),
  type: z.string().min(1, "El tipo de tráiler es requerido"),
  plates: z.string().min(1, "Las placas son requeridas"),
  capacityLinearFeet: z.number().positive("La capacidad debe ser mayor a 0"),
});

export type CreateTrailerRequest = z.infer<typeof createTrailerRequestSchema>;

export const updateTrailerRequestSchema = createTrailerRequestSchema
  .partial()
  .extend({ isActive: z.boolean().optional() });

export type UpdateTrailerRequest = z.infer<typeof updateTrailerRequestSchema>;

// Tráiler como llega en el listado: además trae en qué consolidados ya
// sellados va. Esos embarques guardan su propia copia de unidad, tipo y
// placas, así que editar el tráiler no los cambia.
export const trailerListItemSchema = trailerSchema.extend({
  sealedInFolios: z.array(z.string()),
});

export type TrailerListItem = z.infer<typeof trailerListItemSchema>;

export const findTrailersResponseSchema = z.object({
  data: z.array(trailerListItemSchema),
  pagination: paginationSchema,
});

export type FindTrailersResponse = z.infer<typeof findTrailersResponseSchema>;
