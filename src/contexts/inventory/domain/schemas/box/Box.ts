import { z } from "zod";
import { aggregateRootSchema } from "@contexts/shared/domain/schemas/AggregateRoot";
import { dimensionsSchema } from "@contexts/shared/domain/schemas/Dimensions";
import { moneySchema } from "@contexts/shared/domain/schemas/Money";
export const boxSchema = z.object({
  id: z.string(),
  name: z.string(),
  dimensions: dimensionsSchema,
  stock: z.number().int().min(0),
  price: moneySchema,
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