import { queryOptions, useQuery } from "@tanstack/react-query";
import { orderRepository } from "../../services/orders/orderRepository";

/** Opciones de la query del detalle de una orden — compartidas por `useOrder`
 * y por quien necesite precargarla con `queryClient.fetchQuery`. */
export const orderQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["orders", id],
    queryFn: () => orderRepository.findById(id),
  });

export const useOrder = (id: string | undefined) =>
  useQuery({
    ...orderQueryOptions(id ?? ""),
    enabled: !!id,
  });
