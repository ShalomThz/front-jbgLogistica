import { useQuery, useQueryClient } from "@tanstack/react-query";
import { currencyRepository } from "../services/currencyRepository";

interface UseExchangeRateOptions {
  from: string;
  to: string;
  enabled?: boolean;
  date?: Date;
}

const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const useExchangeRate = ({ from, to, date, enabled = true }: UseExchangeRateOptions) => {
  const queryClient = useQueryClient();
  const isToday = date ? formatDateLocal(date) === formatDateLocal(new Date()) : false;
  const effectiveDate = isToday ? undefined : date;
  const dayKey = effectiveDate ? formatDateLocal(effectiveDate) : "latest";
  const queryKey = ["exchange-rate", from, to, dayKey];

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => currencyRepository.getExchangeRate(from, to, effectiveDate),
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
