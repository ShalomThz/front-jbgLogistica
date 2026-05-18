import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tariffRepository, type UpdateTariffRequest, type CreateTariffRequest } from "@contexts/pricing/infrastructure/services/tariffs/tariffRepository";
import type { FindTariffsResponsePrimitives } from "@contexts/pricing/application/FindTariffsResponse";
import type { Direction, Filter } from "@contexts/shared/domain/services/CreateCriteriaSchema";
import type { TariffPrimitives } from "@contexts/pricing/domain/schemas/tariff/Tariff";
import { tariffKeys } from "./tariffKeys";

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

  const { data, isLoading, error, refetch } = useQuery<FindTariffsResponsePrimitives>({
    queryKey: tariffKeys.list({ page, limit, search, filters, order }),
    queryFn: () => tariffRepository.find({ filters, search, order, limit, offset }),
    enabled,
    placeholderData: keepPreviousData,
  });

  const tariffs = data?.data ?? [];
  const pagination = data?.pagination ?? null;
  const totalPages = pagination && limit ? Math.ceil(pagination.total / limit) : 1;

  /**
   * The backend returns the full tariff in the create/update response, so we
   * seed `useTariffPrice`'s cache with the known price to avoid an extra
   * round-trip and the flash of "no tariff" while `invalidateQueries` refetches.
   */
  const seedPriceCache = (tariff: TariffPrimitives) =>
    queryClient.setQueryData(
      tariffKeys.price({
        zoneId: tariff.originZoneId,
        destinationCountry: tariff.destinationCountry,
        boxId: tariff.boxId,
      }),
      tariff.price,
    );

  const invalidateAll = () =>
    queryClient.invalidateQueries({ queryKey: tariffKeys.all });

  const invalidateLists = () =>
    queryClient.invalidateQueries({ queryKey: tariffKeys.lists() });

  const createMutation = useMutation({
    mutationFn: tariffRepository.create,
    onSuccess: async (tariff) => {
      // Backend rejects duplicates (TariffAlreadyExistsError), so the seed can't
      // collide with a stale price cache — invalidating lists is enough.
      seedPriceCache(tariff);
      await invalidateLists();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTariffRequest }) =>
      tariffRepository.update(id, data),
    onSuccess: async (tariff) => {
      // Update may change zone/country/box, leaving the previous price-cache key
      // stale; safer to invalidate everything under "tariffs".
      seedPriceCache(tariff);
      await invalidateAll();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tariffRepository.delete(id),
    onSuccess: invalidateAll,
  });

  return {
    tariffs,
    pagination,
    totalPages,
    isLoading,
    error: error?.message ?? null,
    refetch,

    createTariff: (data: CreateTariffRequest) => createMutation.mutateAsync(data),
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
