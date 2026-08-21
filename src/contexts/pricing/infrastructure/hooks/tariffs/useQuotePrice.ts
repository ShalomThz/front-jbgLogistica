import { useQuery } from "@tanstack/react-query";
import { tariffRepository } from "@contexts/pricing/infrastructure/services/tariffs/tariffRepository";
import type {
  PickupPoint,
  QuotePriceResponse,
} from "@contexts/pricing/application/QuotePrice";
import type {
  PriceType,
  ServiceLevel,
  ShippingMode,
} from "@contexts/pricing/domain/schemas/tariff/Tariff";
import { tariffKeys } from "./tariffKeys";

interface UseQuotePriceOptions {
  pickup: PickupPoint | undefined;
  /** Del destinatario de la orden, no de un selector. */
  destinationCountry: string | undefined;
  boxId: string | undefined;
  serviceLevel: ServiceLevel | undefined;
  shippingMode: ShippingMode | undefined;
  priceType: PriceType;
  enabled?: boolean;
}

/**
 * Cotiza contra el servidor. El front manda dónde se recoge la caja y recibe la
 * cotización explicada — ya no sabe que existen zonas ni tarifas, así que el
 * mecanismo puede cambiar sin tocar esto.
 *
 * Que no haya tarifa para la combinación es un error esperado: el vendedor
 * escribe el precio a mano.
 */
export const useQuotePrice = ({
  pickup,
  destinationCountry,
  boxId,
  serviceLevel,
  shippingMode,
  priceType,
  enabled = true,
}: UseQuotePriceOptions) => {
  const ready =
    !!pickup && !!destinationCountry && !!boxId && !!serviceLevel && !!shippingMode;

  const { data, isLoading, error, refetch } = useQuery<QuotePriceResponse>({
    queryKey: tariffKeys.quote({
      pickup: pickup!,
      destinationCountry: destinationCountry ?? "",
      boxId: boxId ?? "",
      serviceLevel: serviceLevel!,
      shippingMode: shippingMode!,
      priceType,
    }),
    queryFn: () =>
      tariffRepository.quote({
        pickup: pickup!,
        destinationCountry: destinationCountry!,
        boxId: boxId!,
        serviceLevel: serviceLevel!,
        shippingMode: shippingMode!,
        priceType,
      }),
    enabled: enabled && ready,
    retry: false,
  });

  return {
    quote: data ?? null,
    tariffPrice: data?.price ?? null,
    isLoadingPrice: isLoading,
    priceError: error?.message ?? null,
    refetchPrice: refetch,
  };
};
