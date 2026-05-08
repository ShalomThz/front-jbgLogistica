import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tariffRepository, type UpdateTariffRequest, type CreateTariffRequest } from "@contexts/pricing/infrastructure/services/tariffs/tariffRepository";
import type { FindTariffsResponsePrimitives } from "@contexts/pricing/application/FindTariffsResponse";
import type { Direction, Filter } from "@contexts/shared/domain/services/CreateCriteriaSchema";

const TARIFFS_QUERY_KEY = ["tariffs"];

interface UseTariffsOptions {
  page?: number;
  limit?: number;
  enabled?: boolean;
  filters?: Filter[];
  search?: string;
  order?: { field: string; direction: Direction };
}

export const useTariffs = ({
  page = 1,
  limit,
  enabled = true,
  filters = [],
  search,
  order,
}: UseTariffsOptions = {}) => {
  const queryClient = useQueryClient();
  const offset = limit !== undefined ? (page - 1) * limit : undefined;

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<FindTariffsResponsePrimitives>({
    queryKey: [...TARIFFS_QUERY_KEY, { page, limit, search, filters, order }],
    queryFn: () =>
      tariffRepository.find({ filters, search, order, limit, offset }),
    enabled,
    placeholderData: keepPreviousData,
  });

  const tariffs = data?.data ?? [];
  const pagination = data?.pagination ?? null;
  const totalPages =
    pagination && limit ? Math.ceil(pagination.total / limit) : 1;

  const createMutation = useMutation({
    mutationFn: (data: CreateTariffRequest) => tariffRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TARIFFS_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTariffRequest }) =>
      tariffRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TARIFFS_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tariffRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TARIFFS_QUERY_KEY });
    },
  });

  return {
    tariffs,
    pagination,
    totalPages,
    isLoading,
    error: error?.message ?? null,
    refetch,

    createTariff: (data: CreateTariffRequest) =>
      createMutation.mutateAsync(data),
    isCreating: createMutation.isPending,
    createError: createMutation.error?.message ?? null,

    updateTariff: (id: string, data: UpdateTariffRequest) =>
      updateMutation.mutateAsync({ id, data }),
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error?.message ?? null,

    deleteTariff: (id: string) => deleteMutation.mutateAsync(id),
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error?.message ?? null,
  };
};
