import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orderRepository } from "@contexts/sales/infrastructure/services/orders/orderRepository";

const ORDERS_QUERY_KEY = ["orders"];

export const useCloverCheckout = (orderId: string, enabled = true) => {
  const queryClient = useQueryClient();
  const queryKey = ["clover-checkout", orderId];
  const query = useQuery({
    queryKey,
    queryFn: () => orderRepository.findCloverCheckout(orderId),
    enabled,
    refetchInterval: (current) =>
      current.state.data?.status === "PENDING" ? 5_000 : false,
  });
  const mutation = useMutation({
    mutationFn: (amount: { amount: number; currency: "USD" }) =>
      orderRepository.createCloverCheckout(orderId, amount),
    onSuccess: (checkout) => {
      queryClient.setQueryData(queryKey, checkout);
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
  });

  return {
    checkout: query.data ?? null,
    createCheckout: mutation.mutateAsync,
    isLoading: query.isLoading || mutation.isPending,
    error: query.error?.message ?? mutation.error?.message ?? null,
  };
};
