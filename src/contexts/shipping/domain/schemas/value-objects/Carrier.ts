import { z } from "zod";

const carrierTypes = ["INTERNAL_FLEET", "THIRD_PARTY"] as const;

export const carrierSchema = z.object({
  type: z.enum(carrierTypes),
  providerName: z.string(),
});

export type CarrierType = z.infer<typeof carrierSchema.shape.type>;
export type CarrierPrimitives = z.infer<typeof carrierSchema>;
