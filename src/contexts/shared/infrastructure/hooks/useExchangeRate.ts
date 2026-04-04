import { useQuery } from "@tanstack/react-query";
import { currencyRepository } from "../services/currencyRepository";

interface UseExchangeRateOptions {
  from: string;
  to: string;
  enabled?: boolean;
}

export const useExchangeRate = ({ from, to, enabled = true }: UseExchangeRateOptions) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["exchange-rate", from, to],
    queryFn: () => currencyRepository.getExchangeRate(from, to),
    enabled: enabled && from !== to,
    staleTime: 1000 * 60 * 10,
  });

  return {
    exchangeRate: data ?? null,
    isLoadingRate: isLoading,
    rateError: error?.message ?? null,
  };
};
