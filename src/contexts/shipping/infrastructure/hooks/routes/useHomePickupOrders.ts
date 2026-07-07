import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { shippingPolicies } from "@contexts/shared/domain/policies/shipping.policy";
import type { FindHomePickupOrdersResponse } from "../../../application/route/FindHomePickupOrdersResponse";
import { routeRepository } from "../../services/routes/routeRepository";

/**
 * Órdenes con visita al remitente pendiente y sin ruta activa: recolección
 * (PICKING) o entrega de caja vacía (BOX_DROP).
 *
 * El picker de rutas solo ofrece órdenes de la tienda propia; con el permiso
 * CAN_LIST_ALL_ROUTE_ORDERS se ofrecen las de todas las tiendas.
 */
export const useHomePickupOrders = (
  enabled = true,
  routeType: "PICKING" | "BOX_DROP" = "PICKING",
) => {
  const { user } = useAuth();
  const storeId =
    user && !shippingPolicies.listAllRouteOrders(user)
      ? user.store.id
      : undefined;

  const { data, isLoading, error, refetch } =
    useQuery<FindHomePickupOrdersResponse>({
      queryKey: ["routes", "home-pickup-orders", routeType, storeId],
      queryFn: () => routeRepository.findHomePickupOrders(routeType, storeId),
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
