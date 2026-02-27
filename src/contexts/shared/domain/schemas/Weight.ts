import { z } from "zod";

export const weightUnits = ["kg", "lb"] as const;

export const weightSchema = z.object({
  value: z.number().nonnegative(),
  unit: z.enum(weightUnits).default("kg"),
});

export type WeightUnit = z.infer<typeof weightSchema.shape.unit>;
export type WeightPrimitives = z.infer<typeof weightSchema>;
