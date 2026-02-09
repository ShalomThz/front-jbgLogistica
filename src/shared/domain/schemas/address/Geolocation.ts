import { z } from "zod";

export const geolocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  placeId: z.string().nullable().optional(),
});

export type GeolocationPrimitives = z.infer<typeof geolocationSchema>;
