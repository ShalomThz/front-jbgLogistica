import { shipmentSchema } from "@contexts/shipping/domain/schemas/shipment/Shipment";
import { paginationSchema } from "@contexts/shared/domain/schemas/Pagination";
import { z } from "zod";

export const findShipmentsResponseSchema = z.object({
  data: z.array(shipmentSchema),
  pagination: paginationSchema,
});

export type FindShipmentsResponse = z.infer<typeof findShipmentsResponseSchema>;
