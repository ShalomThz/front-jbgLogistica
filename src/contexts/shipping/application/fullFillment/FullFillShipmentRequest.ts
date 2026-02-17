import { shipmentSchema } from "@contexts/shipping/domain/schemas/shipment/Shipment";
import z from "zod";

export const fulfillShipmentRequestSchema = z.object({
  shipmentId: shipmentSchema.shape.id,
});

export type FulfillShipmentRequest = z.infer<
  typeof fulfillShipmentRequestSchema
>;
