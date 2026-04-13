import { z } from "zod";

export const assignDriverToRouteRequestSchema = z.object({
  routeId: z.string().uuid(),
  driverId: z.string().uuid(),
});

export type AssignDriverToRouteRequest = z.infer<
  typeof assignDriverToRouteRequestSchema
>;
