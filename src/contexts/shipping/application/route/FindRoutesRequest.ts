import type { z } from "zod";
import { routeSchema } from "../../domain/schemas/route/Route";
import { createCriteriaSchema } from "@contexts/shared/domain/services/CreateCriteriaSchema";

export const findRoutesRequestSchema = createCriteriaSchema(routeSchema);

export type FindRoutesRequest = z.infer<typeof findRoutesRequestSchema>;
