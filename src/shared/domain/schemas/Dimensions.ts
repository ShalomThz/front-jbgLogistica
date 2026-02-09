import { z } from "zod";
export const dimensionsSchema = z.object({
  length: z.number().positive("Length must be positive"),
  width: z.number().positive("Width must be positive"),
  height: z.number().positive("Height must be positive"),
  unit: z.enum(["cm", "in"]).default("cm"),
});

export type DimensionsPrimitives = z.infer<typeof dimensionsSchema>;