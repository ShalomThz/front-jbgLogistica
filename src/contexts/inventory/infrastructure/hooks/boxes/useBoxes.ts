import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { boxRepository, type UpdateBoxRequest } from "@contexts/inventory/infrastructure/services/boxes/boxRepository";
import type { CreateBoxRequestPrimitives } from "@contexts/inventory/domain/schemas/box/Box";
import type { FindBoxesResponsePrimitives } from "@contexts/inventory/application/FindBoxesResponse";
import type { Direction, Filter } from "@contexts/shared/domain/services/CreateCriteriaSchema";

const BOXES_QUERY_KEY = ["boxes"];

interface UseBoxesOptions {
  page?: number;
  limit?: number;
  enabled?: boolean;
  filters?: Filter[];
  search?: string;
  order?: { field: string; direction: Direction };
}

export const useBoxes = ({
  page = 1,
  limit,
  enabled = true,
  filters = [],
  search,
  order,
}: UseBoxesOptions = {}) => {
  const queryClient = useQueryClient();
  const offset = limit !== undefined ? (page - 1) * limit : undefined;

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<FindBoxesResponsePrimitives>({
    queryKey: [...BOXES_QUERY_KEY, { page, limit, search, filters, order }],
    queryFn: () =>
      boxRepository.find({ filters, search, order, limit, offset }),
    enabled,
    placeholderData: keepPreviousData,
  });

  const boxes = data?.data ?? [];
  const pagination = data?.pagination ?? null;
  const totalPages =
    pagination && limit ? Math.ceil(pagination.total / limit) : 1;

  const createMutation = useMutation({
    mutationFn: (data: CreateBoxRequestPrimitives) => boxRepository.create(data),
    onSuccess: async () => {
      // Await so mutateAsync only resolves once paginated + infinite caches are refreshed.
      await queryClient.invalidateQueries({ queryKey: BOXES_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBoxRequest }) =>
      boxRepository.update(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: BOXES_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => boxRepository.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: BOXES_QUERY_KEY });
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
