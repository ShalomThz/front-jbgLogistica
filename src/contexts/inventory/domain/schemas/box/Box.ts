import { z } from "zod";
import { aggregateRootSchema, dimensionsSchema } from "@/shared/domain";
export const boxSchema = z.object({
  id: z.string(),
  name: z.string(),
  dimensions: dimensionsSchema,
  stock: z.number().int().positive(),
  ...aggregateRootSchema.shape,
});

export type BoxPrimitives = z.infer<typeof boxSchema>;
// CREATE BOX USE CASE
export const createBoxRequestSchema = boxSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateBoxRequestPrimitives = z.infer<typeof createBoxRequestSchema>;