import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Filter } from "@contexts/shared/domain/services/CreateCriteriaSchema";
import type {
  CreateConsolidationRequest,
  FindConsolidationsResponse,
} from "@contexts/consolidation/domain/schemas/consolidation/Consolidation";
import { consolidationRepository } from "@contexts/consolidation/infrastructure/services/consolidationRepository";

export const CONSOLIDATIONS_QUERY_KEY = ["consolidations"] as const;

interface UseConsolidationsOptions {
  page?: number;
  limit?: number;
  filters?: Filter[];
  search?: string;
}

export const useConsolidations = ({
  page = 1,
  limit = 20,
  filters = [],
  search,
}: UseConsolidationsOptions = {}) => {
  const queryClient = useQueryClient();
  const offset = (page - 1) * limit;

  const { data, isLoading, isFetching, error, refetch } =
    useQuery<FindConsolidationsResponse>({
      queryKey: [...CONSOLIDATIONS_QUERY_KEY, { page, limit, filters, search }],
      queryFn: () =>
        consolidationRepository.find({ filters, limit, offset, search }),
      placeholderData: keepPreviousData,
    });

  const createMutation = useMutation({
    mutationFn: (request: CreateConsolidationRequest) =>
      consolidationRepository.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONSOLIDATIONS_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => consolidationRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONSOLIDATIONS_QUERY_KEY });
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

    createConsolidation: (request: CreateConsolidationRequest) =>
      createMutation.mutateAsync(request),
    isCreating: createMutation.isPending,

    deleteConsolidation: (id: string) => deleteMutation.mutateAsync(id),
    isDeleting: deleteMutation.isPending,
  };
};
