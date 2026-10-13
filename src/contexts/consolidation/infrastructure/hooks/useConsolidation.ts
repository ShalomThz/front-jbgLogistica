import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AddOrdersToConsolidationRequest,
  UpdateConsolidationDetailsRequest,
} from "@contexts/consolidation/domain/schemas/consolidation/Consolidation";
import { consolidationRepository } from "@contexts/consolidation/infrastructure/services/consolidationRepository";
import { CONSOLIDATIONS_QUERY_KEY } from "./useConsolidations";

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
 * listado (el folio/etapa/capacidad que se ve ahí también cambia). */
export const useConsolidationActions = (id: string) => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: consolidationKey(id) });
    queryClient.invalidateQueries({ queryKey: CONSOLIDATIONS_QUERY_KEY });
  };

  const updateDetailsMutation = useMutation({
    mutationFn: (request: UpdateConsolidationDetailsRequest) =>
      consolidationRepository.updateDetails(id, request),
    onSuccess: invalidate,
  });

  const addOrdersMutation = useMutation({
    mutationFn: (request: AddOrdersToConsolidationRequest) =>
      consolidationRepository.addOrders(id, request),
    onSuccess: invalidate,
  });

  const removeOrderMutation = useMutation({
    mutationFn: (orderId: string) =>
      consolidationRepository.removeOrder(id, orderId),
    onSuccess: invalidate,
  });

  const advanceStageMutation = useMutation({
    mutationFn: () => consolidationRepository.advanceStage(id),
    onSuccess: invalidate,
  });

  const attachEvidenceMutation = useMutation({
    mutationFn: (photos: File[]) =>
      consolidationRepository.attachEvidence(id, photos),
    onSuccess: invalidate,
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

    advanceStage: () => advanceStageMutation.mutateAsync(),
    isAdvancingStage: advanceStageMutation.isPending,

    attachEvidence: (photos: File[]) => attachEvidenceMutation.mutateAsync(photos),
    isAttachingEvidence: attachEvidenceMutation.isPending,
  };
};
