import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateShipmentGeolocationRequest } from "../../../application/shipment/UpdateShipmentGeolocationRequest";
import { shipmentRepository } from "../../services/shipments/shipmentRepository";

/**
 * Stores verified routing coordinates on the shipment (pickup or delivery
 * address). Invalidate both order lists and route data so the pickers see the
 * shipment as routable right away.
 */
export const useUpdateShipmentGeolocation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (request: UpdateShipmentGeolocationRequest) =>
      shipmentRepository.updateGeolocation(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
    },
  });

  return {
    updateShipmentGeolocation: async (
      request: UpdateShipmentGeolocationRequest,
    ) => await mutation.mutateAsync(request),
    isUpdatingGeolocation: mutation.isPending,
    updateGeolocationError: mutation.error?.message ?? null,
  };
};
