import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateTrailerRequest,
  UpdateTrailerRequest,
} from "@contexts/consolidation/domain/schemas/trailer/Trailer";
import { trailerRepository } from "@contexts/consolidation/infrastructure/services/trailerRepository";

export const TRAILERS_QUERY_KEY = ["trailers"] as const;

export const useTrailers = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: TRAILERS_QUERY_KEY,
    queryFn: () => trailerRepository.find({ limit: 200 }),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: TRAILERS_QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: (request: CreateTrailerRequest) =>
      trailerRepository.create(request),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateTrailerRequest }) =>
      trailerRepository.update(id, request),
    onSuccess: invalidate,
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
