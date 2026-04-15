import { geolocationSchema } from "@contexts/shared/domain/schemas/address/Geolocation";
import { aggregateRootSchema } from "@contexts/shared/domain/schemas/AggregateRoot";
import { z } from "zod";
import { mapsMetadataSchema } from "../value-objects/MapsMetadata";
import { routeStopSchema } from "./RouteStop";

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
