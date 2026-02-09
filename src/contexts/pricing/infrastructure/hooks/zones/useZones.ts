import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zoneRepository, type UpdateZoneRequest } from "../../services";
import type { ZonePrimitives, FindZonesResponsePrimitives } from "../../../domain/schemas";

const ZONES_QUERY_KEY = ["zones"];

type CreateZoneRequest = Omit<ZonePrimitives, "id" | "createdAt" | "updatedAt">;

interface UseZonesOptions {
  page?: number;
  limit?: number;
}

export const useZones = ({ page = 1, limit = 10 }: UseZonesOptions = {}) => {
  const queryClient = useQueryClient();
  const offset = (page - 1) * limit;

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<FindZonesResponsePrimitives>({
    queryKey: [...ZONES_QUERY_KEY, { page, limit }],
    queryFn: () => zoneRepository.find({ filters: [], limit, offset }),
  });

  const zones = data?.data ?? [];
  const pagination = data?.pagination ?? null;
  const totalPages = pagination ? Math.ceil(pagination.total / limit) : 1;

  const createMutation = useMutation({
    mutationFn: (data: CreateZoneRequest) => zoneRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ZONES_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateZoneRequest }) =>
      zoneRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ZONES_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => zoneRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ZONES_QUERY_KEY });
    },
  });

  return {
    zones,
    pagination,
    totalPages,
    isLoading,
    error: error?.message ?? null,
    refetch,

    createZone: (data: CreateZoneRequest) =>
      createMutation.mutateAsync(data),
    isCreating: createMutation.isPending,
    createError: createMutation.error?.message ?? null,

    updateZone: (id: string, data: UpdateZoneRequest) =>
      updateMutation.mutateAsync({ id, data }),
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error?.message ?? null,

    deleteZone: (id: string) => deleteMutation.mutateAsync(id),
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error?.message ?? null,
  };
};
