import { useQuery } from "@tanstack/react-query";
import type { FindHomePickupOrdersResponse } from "../../../application/route/FindHomePickupOrdersResponse";
import { routeRepository } from "../../services/routes/routeRepository";

/**
 * Órdenes con visita al remitente pendiente y sin ruta activa: recolección
 * (PICKING) o entrega de caja vacía (BOX_DROP).
 */
export const useHomePickupOrders = (
  enabled = true,
  routeType: "PICKING" | "BOX_DROP" = "PICKING",
) => {
  const { data, isLoading, error, refetch } =
    useQuery<FindHomePickupOrdersResponse>({
      queryKey: ["routes", "home-pickup-orders", routeType],
      queryFn: () => routeRepository.findHomePickupOrders(routeType),
      enabled,
      staleTime: 30_000,
    });

  return {
    orders: data?.data ?? [],
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
};
