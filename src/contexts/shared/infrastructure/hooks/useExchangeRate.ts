import { useQuery, useQueryClient } from "@tanstack/react-query";
import { currencyRepository } from "../services/currencyRepository";

interface UseExchangeRateOptions {
  from: string;
  to: string;
  enabled?: boolean;
}

export const useExchangeRate = ({ from, to, enabled = true }: UseExchangeRateOptions) => {
  const queryClient = useQueryClient();
  const queryKey = ["exchange-rate", from, to];

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => currencyRepository.getExchangeRate(from, to),
    enabled: enabled && from !== to,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });

  const invalidateRate = () => queryClient.invalidateQueries({ queryKey });

  return {
    exchangeRate: data ?? null,
    isLoadingRate: isLoading,
    isFetchingRate: isFetching,
    isRateError: isError,
    rateError: error?.message ?? null,
    refetchRate: refetch,
    invalidateRate,
  };
};
