import { z } from "zod";
import { httpClient } from "@contexts/shared/infrastructure/http/httpClient";
import { shipmentTrackingEventSchema } from "../../../domain/schemas/tracking/ShipmentTrackingEvent";

export const trackingRepository = {
  getTimeline: async (trackingNumber: string) => {
    const data = await httpClient<unknown>(
      `/tracking/${encodeURIComponent(trackingNumber)}`,
      {},
      true,
    );

    return z.array(shipmentTrackingEventSchema).parse(data);
  },
};
