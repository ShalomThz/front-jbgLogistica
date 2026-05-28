import { z } from "zod";
import { routeResponseSchema } from "@contexts/shipping/application/route/RouteResponse";
import { paginationSchema } from "@contexts/shared/domain/schemas/Pagination";

export const findRoutesResponseSchema = z.object({
  data: z.array(routeResponseSchema),
  pagination: paginationSchema,
});

export type FindRoutesResponse = z.infer<typeof findRoutesResponseSchema>;
