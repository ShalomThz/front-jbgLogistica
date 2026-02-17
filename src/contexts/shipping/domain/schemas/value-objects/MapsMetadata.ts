import { z } from "zod";

export const mapsMetadataSchema = z.object({
  distanceKm: z.number().nonnegative(),
  durationMinutes: z.number().nonnegative(),
  polyline: z.string(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
});

export type MapsMetadataPrimitives = z.infer<typeof mapsMetadataSchema>;
