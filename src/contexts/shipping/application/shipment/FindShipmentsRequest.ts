import { shipmentSchema } from "@contexts/shipping/domain/schemas/shipment/Shipment";
import { createCriteriaSchema } from "@contexts/shared/domain/services/CreateCriteriaSchema";
import type z from "zod";

export const findShipmentsSchema = createCriteriaSchema(shipmentSchema);

export type FindShipmentsRequest = z.infer<typeof findShipmentsSchema>;
