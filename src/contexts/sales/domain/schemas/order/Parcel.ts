import z from "zod";
import { weightSchema } from "../../../../../shared/domain/schemas/Weight";
import { dimensionsSchema } from "../../../../../shared/domain";

export const parcelSchema = z.object({
  weight: weightSchema,
  dimensions: dimensionsSchema,
});

export type ParcelPrimitives = z.infer<typeof parcelSchema>;