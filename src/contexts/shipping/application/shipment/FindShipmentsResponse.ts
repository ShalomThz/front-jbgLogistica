import { shipmentResponseSchema } from "@contexts/shipping/application/shipment/ShipmentResponse";
import { paginationSchema } from "@contexts/shared/domain/schemas/Pagination";
import { z } from "zod";

export const findShipmentsResponseSchema = z.object({
  data: z.array(shipmentResponseSchema),
  pagination: paginationSchema,
});

export type FindShipmentsResponse = z.infer<typeof findShipmentsResponseSchema>;
