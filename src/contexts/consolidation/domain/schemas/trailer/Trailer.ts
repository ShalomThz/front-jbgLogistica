import { z } from "zod";
import { aggregateRootSchema } from "@contexts/shared/domain/schemas/AggregateRoot";
import { paginationSchema } from "@contexts/shared/domain/schemas/Pagination";

export const trailerSchema = z.object({
  id: z.string(),
  unitNumber: z.string().min(1, "La unidad es requerida"),
  type: z.string().min(1, "El tipo de tráiler es requerido"),
  plates: z.string().min(1, "Las placas son requeridas"),
  capacityLinearFeet: z.number().positive("La capacidad debe ser mayor a 0"),
  isActive: z.boolean().default(true),
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

export const findTrailersResponseSchema = z.object({
  data: z.array(trailerSchema),
  pagination: paginationSchema,
});

export type FindTrailersResponse = z.infer<typeof findTrailersResponseSchema>;
