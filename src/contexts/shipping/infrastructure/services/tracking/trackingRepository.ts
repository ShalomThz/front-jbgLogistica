import { httpClient } from "@contexts/shared/infrastructure/http/httpClient";
import { trackingTimelineResponseSchema } from "../../../domain/schemas/tracking/ShipmentTrackingEvent";

export const trackingRepository = {
  getTimeline: async (trackingNumber: string) => {
    const data = await httpClient<unknown>(
      `/tracking/${encodeURIComponent(trackingNumber)}`,
      {},
      true,
    );

    return trackingTimelineResponseSchema.parse(data);
  },
};
