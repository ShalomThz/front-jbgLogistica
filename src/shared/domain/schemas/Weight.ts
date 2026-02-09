import z from "zod";

const weightUnits = ["kg", "lb"] as const;

export const weightSchema = z.object({
  value: z.number().positive(),
  unit: z.enum(weightUnits),
});

export type WeightUnit = z.infer<typeof weightSchema.shape.unit>;
export type WeightPrimitives = z.infer<typeof weightSchema>;
