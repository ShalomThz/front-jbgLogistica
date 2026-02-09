import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tariffRepository, type UpdateTariffRequest } from "../../services";
import type { TariffPrimitives, FindTariffsResponsePrimitives } from "../../../domain/schemas";

const TARIFFS_QUERY_KEY = ["tariffs"];

type CreateTariffRequest = Omit<TariffPrimitives, "id" | "createdAt" | "updatedAt">;

interface UseTariffsOptions {
  page?: number;
  limit?: number;
}

export const useTariffs = ({ page = 1, limit = 10 }: UseTariffsOptions = {}) => {
  const queryClient = useQueryClient();
  const offset = (page - 1) * limit;

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<FindTariffsResponsePrimitives>({
    queryKey: [...TARIFFS_QUERY_KEY, { page, limit }],
    queryFn: () => tariffRepository.find({ filters: [], limit, offset }),
  });

  const tariffs = data?.data ?? [];
  const pagination = data?.pagination ?? null;
  const totalPages = pagination ? Math.ceil(pagination.total / limit) : 1;

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
