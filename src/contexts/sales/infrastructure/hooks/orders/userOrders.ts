import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateHQOrderRequest } from "../../../application/order/CreateHQOrderRequest";
import type { CreatePartnerOrderRequest } from "../../../application/order/CreatePartnerOrderRequest";
import type { EditOrderRequest } from "../../../application/order/EditOrderRequest";
import type { FindOrdersResponse } from "../../../application/order/FindOrderResponse";
import { orderRepository } from "../../services/orders/orderRepository";

const ORDERS_QUERY_KEY = ["orders"];

interface UseOrdersOptions {
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export const useOrders = ({ page = 1, limit = 10, enabled = true }: UseOrdersOptions = {}) => {
  const queryClient = useQueryClient();
  const offset = (page - 1) * limit;

  const { data, isLoading, error, refetch } =
    useQuery<FindOrdersResponse>({
      queryKey: [...ORDERS_QUERY_KEY, { page, limit }],
      queryFn: () => orderRepository.find({ filters: [], limit, offset }),
      enabled,
    });

  const orders = data?.data ?? [];
  const pagination = data?.pagination ?? null;
  const totalPages = pagination ? Math.ceil(pagination.total / limit) : 1;

  const createHQMutation = useMutation({
    mutationFn: (data: CreateHQOrderRequest) => orderRepository.createHQ(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
  });

  const createPartnerMutation = useMutation({
    mutationFn: (data: CreatePartnerOrderRequest) =>
      orderRepository.createPartner(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditOrderRequest }) =>
      orderRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => orderRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
  });

  return {
    orders,
    pagination,
    totalPages,
    isLoading,
    error: error?.message ?? null,
    refetch,

    createHQOrder: async (data: CreateHQOrderRequest) =>
      await createHQMutation.mutateAsync(data),
    createPartnerOrder: async (data: CreatePartnerOrderRequest) =>
      await createPartnerMutation.mutateAsync(data),
    updateOrder: async (id: string, data: EditOrderRequest) =>
      await updateMutation.mutateAsync({ id, data }),
    deleteOrder: async (id: string) =>
      await deleteMutation.mutateAsync(id),
    isDeleting: deleteMutation.isPending,

    isCreating:
      createHQMutation.isPending ||
      createPartnerMutation.isPending ||
      updateMutation.isPending,
    createError:
      createHQMutation.error?.message ??
      createPartnerMutation.error?.message ??
      updateMutation.error?.message ??
      null,
  };
};
