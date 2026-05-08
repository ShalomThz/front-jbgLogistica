import type z from "zod";
import { zoneSchema } from "@contexts/pricing/domain/schemas/zone/Zone";
import { createCriteriaSchema } from "@contexts/shared/domain/services/CreateCriteriaSchema";

export const findZonesRequestSchema = createCriteriaSchema(zoneSchema);

export type FindZonesRequestPrimitives = z.infer<typeof findZonesRequestSchema>;
