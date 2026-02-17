import { dimensionsSchema } from "@contexts/shared/domain/schemas/Dimensions";
import { weightSchema } from "@contexts/shared/domain/schemas/Weight";
import z from "zod";

export const parcelSchema = z.object({
  weight: weightSchema,
  dimensions: dimensionsSchema,
});

export type ParcelPrimitives = z.infer<typeof parcelSchema>;
