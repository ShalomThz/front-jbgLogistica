import { z } from "zod";
 import { weightSchema } from "../../../../../shared/domain/schemas/Weight";
import { dimensionsSchema } from "../../../../../shared/domain";
 
export const ownershipTypes = ["CUSTOMER", "STORE"] as const;

export const packageSchema = z.object({
  boxId: z.string(),
  ownership: z.enum(ownershipTypes),
  weight: weightSchema,
  dimensions: dimensionsSchema,
});

export type BoxOwnership = z.infer<typeof packageSchema.shape.ownership>;
export type PackagePrimitives = z.infer<typeof packageSchema>;