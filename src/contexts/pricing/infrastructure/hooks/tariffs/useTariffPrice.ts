import { useQuery } from "@tanstack/react-query";
import { tariffRepository } from "@contexts/pricing/infrastructure/services/tariffs/tariffRepository";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";

interface UseTariffPriceOptions {
  zoneId: string;
  destinationCountry: string;
  boxId: string;
  enabled?: boolean;
}

export const useTariffPrice = ({
  zoneId,
  destinationCountry,
  boxId,
  enabled = true,
}: UseTariffPriceOptions) => {
  const { data, isLoading, error, refetch } = useQuery<MoneyPrimitives>({
    queryKey: ["tariffs", "price", { zoneId, destinationCountry, boxId }],
    queryFn: () => tariffRepository.findPrice({ zoneId, destinationCountry, boxId }),
    enabled: enabled && !!zoneId && !!destinationCountry && !!boxId,
    retry: false,
  });

  return {
    tariffPrice: data ?? null,
    isLoadingPrice: isLoading,
    priceError: error?.message ?? null,
    refetchPrice: refetch,
  };
};
