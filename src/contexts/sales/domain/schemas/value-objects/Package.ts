import { dimensionsSchema } from "@contexts/shared/domain/schemas/Dimensions";
import { weightSchema } from "@contexts/shared/domain/schemas/Weight";
import z from "zod";

export const ownershipTypes = ["CUSTOMER", "STORE"] as const;

export const packageSchema = z.object({
  boxId: z.string(),
  ownership: z.enum(ownershipTypes),
  weight: weightSchema,
  dimensions: dimensionsSchema,
});

export type BoxOwnership = z.infer<typeof packageSchema.shape.ownership>;
export type PackagePrimitives = z.infer<typeof packageSchema>;
