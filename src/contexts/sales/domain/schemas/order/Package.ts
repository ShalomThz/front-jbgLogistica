import { z } from "zod";
import { dimensionsSchema } from "@/shared/domain";
export const ownershipTypes = ["OWN", "STORE"] as const;
export const weightUnits = ["kg", "lb"] as const;

export const packageSchema = z.object({
  boxId: z.string().nullable(),
  boxName: z.string(),
  dimensions: dimensionsSchema,
  ownership: z.enum(ownershipTypes),
  goodsWeight: z.number().positive(),
  weightUnit: z.enum(weightUnits),
});

export type BoxOwnership = z.infer<typeof packageSchema.shape.ownership>;
export type WeightUnit = z.infer<typeof packageSchema.shape.weightUnit>;
export type PackagePrimitives = z.infer<typeof packageSchema>;