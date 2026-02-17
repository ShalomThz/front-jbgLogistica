import { useQuery } from "@tanstack/react-query";
import { shipmentRepository } from "../../services/shipments/shipmentRepository";

export const useShipmentByOrderId = (orderId: string | undefined) =>
  useQuery({
    queryKey: ["shipments", "byOrder", orderId],
    queryFn: () => shipmentRepository.findByOrderId(orderId!),
    enabled: !!orderId,
  });
