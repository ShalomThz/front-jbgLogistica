import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { storeRepository, type UpdateStoreRequest } from "../../services";
import type { CreateStoreRequestPrimitives, FindStoresResponsePrimitives } from "../../../domain";

const STORES_QUERY_KEY = ["stores"];

interface UseStoresOptions {
  page?: number;
  limit?: number;
}

export const useStores = ({ page = 1, limit = 10 }: UseStoresOptions = {}) => {
  const queryClient = useQueryClient();
  const offset = (page - 1) * limit;

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<FindStoresResponsePrimitives>({
    queryKey: [...STORES_QUERY_KEY, { page, limit }],
    queryFn: () => storeRepository.find({ filters: [], limit, offset }),
  });

  const stores = data?.data ?? [];
  const pagination = data?.pagination ?? null;
  const totalPages = pagination ? Math.ceil(pagination.total / limit) : 1;

  const createMutation = useMutation({
    mutationFn: (data: CreateStoreRequestPrimitives) => storeRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORES_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStoreRequest }) =>
      storeRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORES_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => storeRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORES_QUERY_KEY });
    },
  });

  return {
    stores,
    pagination,
    totalPages,
    isLoading,
    error: error?.message ?? null,
    refetch,

    createStore: (data: CreateStoreRequestPrimitives) =>
      createMutation.mutateAsync(data),
    isCreating: createMutation.isPending,
    createError: createMutation.error?.message ?? null,

    updateStore: (id: string, data: UpdateStoreRequest) =>
      updateMutation.mutateAsync({ id, data }),
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error?.message ?? null,

    deleteStore: (id: string) => deleteMutation.mutateAsync(id),
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error?.message ?? null,
  };
};
