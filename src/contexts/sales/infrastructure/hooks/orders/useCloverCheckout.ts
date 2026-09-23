import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orderRepository } from "@contexts/sales/infrastructure/services/orders/orderRepository";
import type { CloverCheckoutEmailRecipient } from "@contexts/sales/domain/schemas/CloverCheckout";

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
  const sendEmailMutation = useMutation({
    mutationFn: (recipient: CloverCheckoutEmailRecipient) =>
      orderRepository.sendCloverCheckoutEmail(orderId, recipient),
  });

  return {
    checkout: query.data ?? null,
    createCheckout: mutation.mutateAsync,
    sendCheckoutEmail: sendEmailMutation.mutateAsync,
    isSendingCheckoutEmail: sendEmailMutation.isPending,
    isLoading: query.isLoading || mutation.isPending,
    error: query.error?.message ?? mutation.error?.message ?? null,
  };
};
