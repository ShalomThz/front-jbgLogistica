import { z } from "zod";
import { routeSchema } from "../../domain/schemas/route/Route";
import { paginationSchema } from "@contexts/shared/domain/schemas/Pagination";

export const findRoutesResponseSchema = z.object({
  data: z.array(routeSchema),
  pagination: paginationSchema,
});

export type FindRoutesResponse = z.infer<typeof findRoutesResponseSchema>;
