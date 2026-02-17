import { useQuery } from "@tanstack/react-query";
import { orderRepository } from "../../services/orders/orderRepository";

export const useOrder = (id: string | undefined) =>
  useQuery({
    queryKey: ["orders", id],
    queryFn: () => orderRepository.findById(id!),
    enabled: !!id,
  });
