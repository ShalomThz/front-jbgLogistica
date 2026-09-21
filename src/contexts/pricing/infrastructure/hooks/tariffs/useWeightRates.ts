import type {
  SetZoneWeightRateRequest,
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

  // Sin altas ni ediciones por fila: la pantalla escribe la celda entera, y una
  // fila suelta puede quedar con distinta unidad o moneda que su par, algo que
  // la matriz no sabe representar y pisaría al guardar.
  return {
    weightRates: data ?? EMPTY,
    isLoading,
    error: error?.message ?? null,
    refetch,
    setWeightRate: setRateMutation.mutateAsync,
    isSaving: setRateMutation.isPending,
  };
};
