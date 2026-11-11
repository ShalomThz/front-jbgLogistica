import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AddOrdersToConsolidationRequest,
  UpdateConsolidationDetailsRequest,
  UpdateConsolidationOrderCommentsRequest,
} from "@contexts/consolidation/domain/schemas/consolidation/Consolidation";
import { consolidationRepository } from "@contexts/consolidation/infrastructure/services/consolidationRepository";
import { CONSOLIDATIONS_QUERY_KEY } from "./useConsolidations";
import { TRAILERS_QUERY_KEY } from "./useTrailers";

const consolidationKey = (id: string) => [...CONSOLIDATIONS_QUERY_KEY, id] as const;

/** El detalle ya trae todo lo que necesitan las pestañas (órdenes
 * enriquecidas, conductor, tráiler, historial) en una sola respuesta — no hay
 * un hook de historial aparte, `GET /consolidation/:id` no tiene ese
 * endpoint. */
export const useConsolidation = (id: string | undefined) =>
  useQuery({
    queryKey: consolidationKey(id ?? ""),
    queryFn: () => consolidationRepository.getById(id!),
    enabled: !!id,
  });

/** Mutaciones sobre un consolidado puntual: invalidan tanto su detalle como el
 * listado (el folio/etapa/capacidad que se ve ahí también cambia). También al
 * fallar (`onSettled`): un rechazo suele ser que el consolidado cambió por
 * otro lado, y la pantalla debe mostrar el estado real. */
export const useConsolidationActions = (id: string) => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: consolidationKey(id) });
    queryClient.invalidateQueries({ queryKey: CONSOLIDATIONS_QUERY_KEY });
    // El catálogo de tráilers dice en qué consolidados va cada uno y cuáles
    // ya se sellaron: cambiar el tráiler o la etapa lo deja viejo.
    queryClient.invalidateQueries({ queryKey: TRAILERS_QUERY_KEY });
  };

  const updateDetailsMutation = useMutation({
    mutationFn: (request: UpdateConsolidationDetailsRequest) =>
      consolidationRepository.updateDetails(id, request),
    onSettled: invalidate,
  });

  const addOrdersMutation = useMutation({
    mutationFn: (request: AddOrdersToConsolidationRequest) =>
      consolidationRepository.addOrders(id, request),
    onSettled: invalidate,
  });

  const removeOrderMutation = useMutation({
    mutationFn: (orderId: string) =>
      consolidationRepository.removeOrder(id, orderId),
    onSettled: invalidate,
  });

  const updateOrderCommentsMutation = useMutation({
    mutationFn: (request: UpdateConsolidationOrderCommentsRequest) =>
      consolidationRepository.updateOrderComments(id, request),
    onSettled: invalidate,
  });

  const advanceStageMutation = useMutation({
    mutationFn: () => consolidationRepository.advanceStage(id),
    onSettled: invalidate,
  });

  const attachEvidenceMutation = useMutation({
    mutationFn: (photos: File[]) =>
      consolidationRepository.attachEvidence(id, photos),
    onSettled: invalidate,
  });

  return {
    updateDetails: (request: UpdateConsolidationDetailsRequest) =>
      updateDetailsMutation.mutateAsync(request),
    isUpdatingDetails: updateDetailsMutation.isPending,

    addOrders: (request: AddOrdersToConsolidationRequest) =>
      addOrdersMutation.mutateAsync(request),
    isAddingOrders: addOrdersMutation.isPending,

    removeOrder: (orderId: string) => removeOrderMutation.mutateAsync(orderId),
    isRemovingOrder: removeOrderMutation.isPending,

    updateOrderComments: (request: UpdateConsolidationOrderCommentsRequest) =>
      updateOrderCommentsMutation.mutateAsync(request),
    isUpdatingOrderComments: updateOrderCommentsMutation.isPending,

    advanceStage: () => advanceStageMutation.mutateAsync(),
    isAdvancingStage: advanceStageMutation.isPending,

    attachEvidence: (photos: File[]) => attachEvidenceMutation.mutateAsync(photos),
    isAttachingEvidence: attachEvidenceMutation.isPending,
  };
};
