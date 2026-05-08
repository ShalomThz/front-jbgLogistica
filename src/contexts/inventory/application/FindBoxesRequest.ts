import type z from "zod";
import { boxSchema } from "@contexts/inventory/domain/schemas/box/Box";
import { createCriteriaSchema } from "@contexts/shared/domain/services/CreateCriteriaSchema";

export const findBoxesRequestSchema = createCriteriaSchema(boxSchema);

export type FindBoxesRequestPrimitives = z.infer<typeof findBoxesRequestSchema>;
