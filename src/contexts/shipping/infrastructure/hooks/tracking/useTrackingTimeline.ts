import { useQuery } from "@tanstack/react-query";
import { trackingRepository } from "../../services/tracking/trackingRepository";

export const useTrackingTimeline = (trackingNumber: string | undefined) =>
  useQuery({
    queryKey: ["shipping-tracking", trackingNumber],
    queryFn: () => trackingRepository.getTimeline(trackingNumber!),
    enabled: !!trackingNumber,
  });
