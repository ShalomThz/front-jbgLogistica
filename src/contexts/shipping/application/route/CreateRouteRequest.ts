import { z } from "zod";

export const createRouteRequestSchema = z.object({
  originLat: z.number(),
  originLng: z.number(),
  originPlaceId: z.string().optional(),
  shipmentIds: z.array(z.string().uuid()),
});

export type CreateRouteRequest = z.infer<typeof createRouteRequestSchema>;
