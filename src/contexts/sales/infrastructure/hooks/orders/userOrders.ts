import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateHQOrderRequest } from "../../../domain/schemas/order/Order";
import { orderRepository } from "../../services/orders/orderRepository";

const ORDERS_QUERY_KEY = ["orders"];

export const useOrders = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateHQOrderRequest) => orderRepository.createHQ(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
  });


  return {
    createHQOrder: async (data: CreateHQOrderRequest) => await createMutation.mutateAsync(data),
    isCreating: createMutation.isPending,
    createError: createMutation.error?.message ?? null,
  };
};
