import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tariffRepository } from "@contexts/pricing/infrastructure/services/tariffs/tariffRepository";
import type {
  SetZonePriceRequest,
  ZonePriceMatrix,
} from "@contexts/pricing/application/ZonePriceMatrix";
import type { ShippingMode } from "@contexts/pricing/domain/schemas/tariff/Tariff";
import { tariffKeys } from "./tariffKeys";

/**
 * La zona como tabla. Sirve para dos cosas con la misma llamada: la vista de
 * administración (y la del vendedor que cotiza cambiando de zona), y saber qué
 * cajas y servicios tienen precio en esa zona.
 *
 * La matriz es por modo de transporte: caja × servicio ya son dos ejes, y el
 * modo como tercero daría doce columnas por caja.
 *
 * `setPrice` escribe la celda entera —público y socio— en un solo comando: si
 * se editaran filas sueltas, tarde o temprano alguien actualiza una y se olvida
 * de la otra.
 */
export const useZonePriceMatrix = (
  zoneId: string | undefined,
  destinationCountry = "MX",
  shippingMode: ShippingMode = "GROUND",
) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<ZonePriceMatrix>({
    queryKey: tariffKeys.matrix(zoneId ?? "", destinationCountry, shippingMode),
    queryFn: () =>
      tariffRepository.matrix(zoneId!, destinationCountry, shippingMode),
    enabled: !!zoneId,
  });

  const setPriceMutation = useMutation({
    mutationFn: (request: SetZonePriceRequest) => tariffRepository.setZonePrice(request),
    onSuccess: async () => {
      // Cambiar un precio invalida cotizaciones y listas, no solo la matriz.
      await queryClient.invalidateQueries({ queryKey: tariffKeys.all });
    },
  });

  return {
    matrix: data ?? null,
    rows: data?.rows ?? [],
    zone: data?.zone ?? null,
    destinationCountry: data?.destinationCountry ?? destinationCountry,
    shippingMode: data?.shippingMode ?? shippingMode,
    isLoading,
    error: error?.message ?? null,
    refetch,

    setPrice: (request: SetZonePriceRequest) => setPriceMutation.mutateAsync(request),
    isSaving: setPriceMutation.isPending,
    saveError: setPriceMutation.error?.message ?? null,
  };
};
