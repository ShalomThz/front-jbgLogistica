import { useQuery } from "@tanstack/react-query";
import { storeRepository } from "@contexts/iam/infrastructure/services/stores/storeRepository";
import { tariffRepository } from "@contexts/pricing/infrastructure/services/tariffs/tariffRepository";

interface UseTariffLookupOptions {
  storeId: string | undefined;
  boxId: string | null;
  destinationCountry: string;
  enabled?: boolean;
}

export const useTariffLookup = ({
  storeId,
  boxId,
  destinationCountry,
  enabled = true,
}: UseTariffLookupOptions) => {
  const canLookup = enabled && !!storeId && !!boxId && destinationCountry.length === 2;

  const storeQuery = useQuery({
    queryKey: ["stores", storeId],
    queryFn: () => storeRepository.getById(storeId!),
    enabled: canLookup,
  });

  const zoneId = storeQuery.data?.zone.id;

  const tariffQuery = useQuery({
    queryKey: ["tariff-lookup", zoneId, boxId, destinationCountry],
    queryFn: () =>
      tariffRepository.find({
        filters: [
          { field: "zone.id", filterOperator: "=", value: zoneId },
          { field: "box.id", filterOperator: "=", value: boxId },
          { field: "destinationCountry", filterOperator: "=", value: destinationCountry },
        ],
        limit: 1,
      }),
    enabled: canLookup && !!zoneId,
  });

  const tariffPrice = tariffQuery.data?.data[0]?.price ?? null;
  const tariffNotFound = canLookup && tariffQuery.isSuccess && !tariffPrice;

  return {
    tariffPrice,
    tariffNotFound,
    isLoading: storeQuery.isLoading || tariffQuery.isLoading,
  };
};
