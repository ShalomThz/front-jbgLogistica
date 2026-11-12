import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Direction, Filter } from "@contexts/shared/domain/services/CreateCriteriaSchema";
import type { FindConsolidationsResponse } from "@contexts/consolidation/domain/schemas/consolidation/Consolidation";
import { consolidationRepository } from "@contexts/consolidation/infrastructure/services/consolidationRepository";
import { consolidationKeys } from "./consolidationKeys";
import { trailerKeys } from "./trailerKeys";

interface UseConsolidationsOptions {
  page?: number;
  limit?: number;
  filters?: Filter[];
  order?: { field: string; direction: Direction };
  search?: string;
}

/** El listado. Crear va aparte (`useCreateConsolidation`). */
export const useConsolidations = ({
  page = 1,
  limit = 20,
  filters = [],
  order,
  search,
}: UseConsolidationsOptions = {}) => {
  const queryClient = useQueryClient();
  const offset = (page - 1) * limit;

  const { data, isLoading, isFetching, error, refetch } =
    useQuery<FindConsolidationsResponse>({
      queryKey: consolidationKeys.list({ page, limit, filters, order, search }),
      queryFn: () =>
        consolidationRepository.find({ filters, order, limit, offset, search }),
      placeholderData: keepPreviousData,
    });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => consolidationRepository.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: consolidationKeys.detail(id) });
    },
    // También al fallar: un rechazo suele ser que el consolidado cambió por
    // otro lado (lo sellaron, le movieron órdenes), y el listado debe
    // mostrar el estado real.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: consolidationKeys.all });
      // El catálogo de tráilers dice en qué consolidados va cada uno.
      queryClient.invalidateQueries({ queryKey: trailerKeys.all });
    },
  });

  const consolidations = data?.data ?? [];
  const pagination = data?.pagination ?? null;
  const totalPages = pagination ? Math.ceil(pagination.total / limit) : 1;

  return {
    consolidations,
    pagination,
    totalPages,
    isLoading,
    isFetching,
    error: error?.message ?? null,
    refetch,

    deleteConsolidation: (id: string) => deleteMutation.mutateAsync(id),
    isDeleting: deleteMutation.isPending,
  };
};
