import { geolocationSchema } from "@contexts/shared/domain/schemas/address/Geolocation";
import { z } from "zod";

export const updateShipmentGeolocationRequestSchema = z.object({
  shipmentId: z.string().min(1),
  kind: z.enum(["PICKUP", "DELIVERY"]),
  geolocation: geolocationSchema,
});

export type UpdateShipmentGeolocationRequest = z.infer<
  typeof updateShipmentGeolocationRequestSchema
>;
