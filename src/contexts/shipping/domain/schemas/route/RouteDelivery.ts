import { z } from "zod";
import { geolocationSchema } from "@/shared/domain";
import { aggregateRootSchema } from "@/shared/domain";
import { routeStopSchema } from "./RouteStop";
import { mapsMetadataSchema } from "./MapsMetadata";
const statuses = ["PLANNED", "ACTIVE", "COMPLETED"] as const;

export const routeSchema = z.object({
  id: z.string(),
  origin: geolocationSchema,
  driverId: z.string(),
  stops: z.array(routeStopSchema),
  status: z.enum(statuses),
  finishDate: z.date().nullable(),
  mapsMetadata: mapsMetadataSchema.nullable(),
  ...aggregateRootSchema.shape,
});

export type RouteStatus = z.infer<typeof routeSchema.shape.status>;
export type RoutePrimitives = z.infer<typeof routeSchema>;