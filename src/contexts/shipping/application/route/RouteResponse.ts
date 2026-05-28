import { routeSchema } from "@contexts/shipping/domain/schemas/route/Route";
import { routeStopSchema } from "@contexts/shipping/domain/schemas/route/RouteStop";
import { responseAddressSchema } from "@contexts/shared/domain/schemas/address/Address";
import { z } from "zod";

export const routeStopResponseSchema = routeStopSchema.extend({
  address: responseAddressSchema,
});

export type RouteStopResponsePrimitives = z.infer<
  typeof routeStopResponseSchema
>;

export const routeResponseSchema = routeSchema.extend({
  stops: z.array(routeStopResponseSchema),
});

export type RouteResponsePrimitives = z.infer<typeof routeResponseSchema>;
