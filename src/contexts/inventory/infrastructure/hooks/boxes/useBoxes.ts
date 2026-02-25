import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { boxRepository, type UpdateBoxRequest } from "@contexts/inventory/infrastructure/services/boxes/boxRepository";
import type { CreateBoxRequestPrimitives } from "@contexts/inventory/domain/schemas/box/Box";
import type { FindBoxesResponsePrimitives } from "@contexts/inventory/application/FindBoxesResponse";

const BOXES_QUERY_KEY = ["boxes"];

interface UseBoxesOptions {
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export const useBoxes = ({ page = 1, limit = 10, enabled = true }: UseBoxesOptions = {}) => {
  const queryClient = useQueryClient();
  const offset = (page - 1) * limit;

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<FindBoxesResponsePrimitives>({
    queryKey: [...BOXES_QUERY_KEY, { page, limit }],
    queryFn: () => boxRepository.find({ filters: [], limit, offset }),
    enabled,
  });

  const boxes = data?.data ?? [];
  const pagination = data?.pagination ?? null;
  const totalPages = pagination ? Math.ceil(pagination.total / limit) : 1;

  const createMutation = useMutation({
    mutationFn: (data: CreateBoxRequestPrimitives) => boxRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOXES_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBoxRequest }) =>
      boxRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOXES_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => boxRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOXES_QUERY_KEY });
    },
  });

  return {
    boxes,
    pagination,
    totalPages,
    isLoading,
    error: error?.message ?? null,
    refetch,

    createBox: (data: CreateBoxRequestPrimitives) =>
      createMutation.mutateAsync(data),
    isCreating: createMutation.isPending,
    createError: createMutation.error?.message ?? null,

    updateBox: (id: string, data: UpdateBoxRequest) =>
      updateMutation.mutateAsync({ id, data }),
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error?.message ?? null,

    deleteBox: (id: string) => deleteMutation.mutateAsync(id),
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error?.message ?? null,
  };
};
