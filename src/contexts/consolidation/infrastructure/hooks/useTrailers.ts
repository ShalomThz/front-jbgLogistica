import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateTrailerRequest,
  UpdateTrailerRequest,
} from "@contexts/consolidation/domain/schemas/trailer/Trailer";
import { trailerRepository } from "@contexts/consolidation/infrastructure/services/trailerRepository";
import { consolidationKeys } from "./consolidationKeys";
import { trailerKeys } from "./trailerKeys";

export const useTrailers = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: trailerKeys.all,
    queryFn: () => trailerRepository.find({ limit: 200 }),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: trailerKeys.all });

  const createMutation = useMutation({
    mutationFn: (request: CreateTrailerRequest) =>
      trailerRepository.create(request),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateTrailerRequest }) =>
      trailerRepository.update(id, request),
    onSuccess: () => {
      invalidate();
      // El listado y el detalle de consolidados muestran unidad y placas.
      queryClient.invalidateQueries({ queryKey: consolidationKeys.all });
    },
  });

  return {
    trailers: data?.data ?? [],
    isLoading,
    error: error?.message ?? null,
    refetch,

    createTrailer: (request: CreateTrailerRequest) =>
      createMutation.mutateAsync(request),
    isCreating: createMutation.isPending,

    updateTrailer: (id: string, request: UpdateTrailerRequest) =>
      updateMutation.mutateAsync({ id, request }),
    isUpdating: updateMutation.isPending,
  };
};
