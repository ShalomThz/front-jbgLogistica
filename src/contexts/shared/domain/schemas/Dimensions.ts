import { z } from "zod";

export const dimensionUnits = ["cm", "in"] as const;

export const dimensionsSchema = z.object({
  length: z.number().positive("Length must be positive"),
  width: z.number().positive("Width must be positive"),
  height: z.number().positive("Height must be positive"),
  unit: z.enum(dimensionUnits).default("cm"),
});

export type DimensionUnit = z.infer<typeof dimensionsSchema.shape.unit>;
export type DimensionsPrimitives = z.infer<typeof dimensionsSchema>;