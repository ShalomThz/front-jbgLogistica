import { useQuery } from "@tanstack/react-query";
import type { FindHomePickupOrdersResponse } from "../../../application/route/FindHomePickupOrdersResponse";
import { routeRepository } from "../../services/routes/routeRepository";

const HOME_PICKUP_ORDERS_QUERY_KEY = ["routes", "home-pickup-orders"] as const;

/**
 * Órdenes "aplica recolección a domicilio" con envío FULFILLED por la flota
 * JBG y sin ruta activa — candidatas a una ruta de recolección.
 */
export const useHomePickupOrders = (enabled = true) => {
  const { data, isLoading, error, refetch } =
    useQuery<FindHomePickupOrdersResponse>({
      queryKey: HOME_PICKUP_ORDERS_QUERY_KEY,
      queryFn: () => routeRepository.findHomePickupOrders(),
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
