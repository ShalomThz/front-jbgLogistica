import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AddOrdersToConsolidationRequest,
  UpdateConsolidationDetailsRequest,
  UpdateConsolidationOrderCommentsRequest,
} from "@contexts/consolidation/domain/schemas/consolidation/Consolidation";
import { consolidationRepository } from "@contexts/consolidation/infrastructure/services/consolidationRepository";
import { consolidationKeys } from "./consolidationKeys";
import { trailerKeys } from "./trailerKeys";

/**
 * Sin los 5 minutos de caché del resto (como `useShipment`): varias personas
 * editan el mismo consolidado y el back rechaza guardar sobre una versión
 * vieja. Al entrar se muestra lo que haya y se vuelve a pedir.
 */
const ALWAYS_FRESH = { staleTime: 0 } as const;

/** El detalle ya trae todo lo que necesitan las pestañas (órdenes
 * enriquecidas, conductor, tráiler, historial) en una sola respuesta — no hay
 * un hook de historial aparte, `GET /consolidation/:id` no tiene ese
 * endpoint. */
export const useConsolidation = (id: string | undefined) =>
  useQuery({
    queryKey: consolidationKeys.detail(id ?? ""),
    queryFn: () => consolidationRepository.getById(id!),
    enabled: !!id,
    ...ALWAYS_FRESH,
  });

/** Mutaciones sobre un consolidado puntual: invalidan todo lo de
 * consolidados (su detalle, el listado, las órdenes disponibles). También al
 * fallar (`onSettled`): un rechazo suele ser que el consolidado cambió por
 * otro lado, y la pantalla debe mostrar el estado real. */
export const useConsolidationActions = (id: string) => {
  const queryClient = useQueryClient();

  // Se espera la recarga de consolidados (como en `useBoxes`): `mutateAsync`
  // resuelve con el detalle ya fresco, y quien limpia sus borradores al
  // terminar no ve reaparecer un momento los valores anteriores.
  const invalidate = async () => {
    // El catálogo de tráilers dice en qué consolidados va cada uno y cuáles
    // ya se sellaron: cambiar el tráiler o la etapa lo deja viejo. No se
    // espera: esta pantalla no lo muestra.
    void queryClient.invalidateQueries({ queryKey: trailerKeys.all });
    await queryClient.invalidateQueries({ queryKey: consolidationKeys.all });
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
