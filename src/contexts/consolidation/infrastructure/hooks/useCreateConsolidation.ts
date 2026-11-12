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
    },
    // También al fallar: el rechazo suele ser que otra persona tomó la unidad,
    // y el catálogo debe mostrarla ocupada. Sin devolver la promesa a
    // propósito: `mutateAsync` resuelve antes del refetch, y el asistente
    // marca el alta como hecha antes de ver su unidad ocupada por el
    // consolidado propio (si no, la soltaría).
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: trailerKeys.all });
    },
  });

  return {
    createConsolidation: (request: CreateConsolidationRequest) =>
      mutation.mutateAsync(request),
    isCreating: mutation.isPending,
  };
};
