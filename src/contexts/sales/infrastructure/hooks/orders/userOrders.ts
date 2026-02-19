import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateHQOrderRequest } from "../../../application/order/CreateHQOrderRequest";
import type { CreatePartnerOrderRequest } from "../../../application/order/CreatePartnerOrderRequest";
import type { FindOrdersResponse } from "../../../application/order/FindOrderResponse";
import { orderRepository } from "../../services/orders/orderRepository";

const ORDERS_QUERY_KEY = ["orders"];

interface UseOrdersOptions {
  page?: number;
  limit?: number;
}

export const useOrders = ({ page = 1, limit = 10 }: UseOrdersOptions = {}) => {
  const queryClient = useQueryClient();
  const offset = (page - 1) * limit;

  const { data, isLoading, error, refetch } =
    useQuery<FindOrdersResponse>({
      queryKey: [...ORDERS_QUERY_KEY, { page, limit }],
      queryFn: () => orderRepository.find({ filters: [], limit, offset }),
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

  const updateHQMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateHQOrderRequest }) =>
      orderRepository.updateHQ(id, data),
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

  const updatePartnerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreatePartnerOrderRequest }) =>
      orderRepository.updatePartner(id, data),
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
    updateHQOrder: async (id: string, data: CreateHQOrderRequest) =>
      await updateHQMutation.mutateAsync({ id, data }),
    createPartnerOrder: async (data: CreatePartnerOrderRequest) =>
      await createPartnerMutation.mutateAsync(data),
    updatePartnerOrder: async (id: string, data: CreatePartnerOrderRequest) =>
      await updatePartnerMutation.mutateAsync({ id, data }),
    isCreating:
      createHQMutation.isPending ||
      createPartnerMutation.isPending ||
      updateHQMutation.isPending ||
      updatePartnerMutation.isPending,
    createError:
      createHQMutation.error?.message ??
      createPartnerMutation.error?.message ??
      updateHQMutation.error?.message ??
      updatePartnerMutation.error?.message ??
      null,
  };
};
