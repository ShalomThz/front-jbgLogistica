import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateConsolidationRequest } from "@contexts/consolidation/domain/schemas/consolidation/Consolidation";
import { consolidationRepository } from "@contexts/consolidation/infrastructure/services/consolidationRepository";
import { consolidationKeys } from "./consolidationKeys";
import { trailerKeys } from "./trailerKeys";

/**
 * Crear un consolidado, sin la query del listado: el alta no la necesita y
 * `useConsolidations` la pediría de más.
 */
export const useCreateConsolidation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (request: CreateConsolidationRequest) =>
      consolidationRepository.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consolidationKeys.all });
      // El catálogo de tráilers dice en qué consolidados va cada uno.
      queryClient.invalidateQueries({ queryKey: trailerKeys.all });
    },
  });

  return {
    createConsolidation: (request: CreateConsolidationRequest) =>
      mutation.mutateAsync(request),
    isCreating: mutation.isPending,
  };
};
