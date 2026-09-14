import type {
  CreateWeightRateRequest,
  SetZoneWeightRateRequest,
  UpdateWeightRateRequest,
  WeightRatePrimitives,
} from "@contexts/pricing/application/WeightRate";
import { weightRateRepository } from "@contexts/pricing/infrastructure/services/tariffs/weightRateRepository";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tariffKeys } from "./tariffKeys";

const EMPTY: WeightRatePrimitives[] = [];

/**
 * Las tarifas por peso de una zona.
 *
 * Invalida `tariffKeys.all` al escribir, igual que la matriz: cambiar un precio
 * invalida también las cotizaciones, no solo esta lista.
 */
export const useWeightRates = (zoneId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: tariffKeys.weightRates(zoneId ?? ""),
    queryFn: () => weightRateRepository.find(zoneId),
    enabled: !!zoneId,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: tariffKeys.all });

  /** Escribe la celda entera. Es el camino que usa la pantalla: precios
   * sueltos terminan con el público actualizado y el de socio viejo. */
  const setRateMutation = useMutation({
    mutationFn: (request: SetZoneWeightRateRequest) =>
      weightRateRepository.setZoneWeightRate(request),
    onSuccess: invalidate,
  });

  const createMutation = useMutation({
    mutationFn: (request: CreateWeightRateRequest) =>
      weightRateRepository.create(request),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: string;
      request: UpdateWeightRateRequest;
    }) => weightRateRepository.update(id, request),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => weightRateRepository.remove(id),
    onSuccess: invalidate,
  });

  return {
    weightRates: data ?? EMPTY,
    isLoading,
    error: error?.message ?? null,
    refetch,
    setWeightRate: setRateMutation.mutateAsync,
    createWeightRate: createMutation.mutateAsync,
    updateWeightRate: updateMutation.mutateAsync,
    removeWeightRate: removeMutation.mutateAsync,
    isSaving:
      setRateMutation.isPending ||
      createMutation.isPending ||
      updateMutation.isPending ||
      removeMutation.isPending,
  };
};
