import { z } from "zod";
import { geolocationSchema } from "@contexts/shared/domain/schemas/address/Geolocation";
import { aggregateRootSchema } from "@contexts/shared/domain/schemas/AggregateRoot";
import { routeStopSchema } from "./RouteStop";
import { mapsMetadataSchema } from "./MapsMetadata";

const statuses = ["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"] as const;

export const routeSchema = z.object({
  id: z.string(),
  origin: geolocationSchema,
  driverId: z.string(),
  stops: z.array(routeStopSchema),
  status: z.enum(statuses),
  finishDate: z.iso.datetime({ offset: true }).nullable(),
  mapsMetadata: mapsMetadataSchema.nullable(),
  ...aggregateRootSchema.shape,
});

export type RouteStatus = z.infer<typeof routeSchema.shape.status>;
export type RoutePrimitives = z.infer<typeof routeSchema>;
