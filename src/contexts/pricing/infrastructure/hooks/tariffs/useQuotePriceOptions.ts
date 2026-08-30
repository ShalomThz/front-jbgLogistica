import { useQuery } from "@tanstack/react-query";
import { tariffRepository } from "@contexts/pricing/infrastructure/services/tariffs/tariffRepository";
import type {
  PickupPoint,
  QuotePriceResponse,
} from "@contexts/pricing/application/QuotePrice";
import type { PriceType } from "@contexts/pricing/domain/schemas/tariff/Tariff";
import { tariffKeys } from "./tariffKeys";

interface UseQuotePriceOptionsArgs {
  pickup: PickupPoint | undefined;
  /** Del destinatario de la orden, no de un selector. */
  destinationCountry: string | undefined;
  boxId: string | undefined;
  priceType: PriceType;
  enabled?: boolean;
}

/**
 * El menú de servicios tarifados para esta caja y este destino, con su precio.
 *
 * Es lo que pinta la tabla de selección: en vez de cuatro selectores que
 * recotizan en silencio, el vendedor ve las opciones que existen y elige una.
 * Una lista vacía no es un error — significa que esa combinación no está
 * tarifada y el precio va a mano.
 */
export const useQuotePriceOptions = ({
  pickup,
  destinationCountry,
  boxId,
  priceType,
  enabled = true,
}: UseQuotePriceOptionsArgs) => {
  const ready = !!pickup && !!destinationCountry && !!boxId;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: tariffKeys.quoteOptions({
      pickup: pickup!,
      destinationCountry: destinationCountry ?? "",
      boxId: boxId ?? "",
      priceType,
    }),
    queryFn: () =>
      tariffRepository.quoteOptions({
        pickup: pickup!,
        destinationCountry: destinationCountry!,
        boxId: boxId!,
        priceType,
      }),
    enabled: enabled && ready,
    retry: false,
  });

  const options: QuotePriceResponse[] = data?.options ?? [];

  return {
    options,
    isLoadingOptions: isLoading,
    optionsError: error?.message ?? null,
    refetchOptions: refetch,
  };
};
