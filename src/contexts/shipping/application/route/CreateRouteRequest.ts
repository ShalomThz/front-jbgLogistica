import { z } from "zod";
import { geolocationSchema } from "../../../shared/domain/schemas/address/Geolocation";

export const createRouteRequestSchema = z.object({
  origin: geolocationSchema,
  shipmentIds: z.array(z.string()),
  driverId: z.string(),
  type: z.enum(["DELIVERY", "PICKING"]).default("DELIVERY"),
});

export type CreateRouteRequest = z.infer<typeof createRouteRequestSchema>;