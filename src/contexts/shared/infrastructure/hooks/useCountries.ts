import { useQuery } from "@tanstack/react-query";
import { sharedRepository, type CountriesResponse } from "../services/sharedRepository";
import type { FindCountriesRequest } from "@contexts/shared/domain/schemas/address/Country";

const COUNTRIES_QUERY_KEY = ["countries"];

export const useCountries = (request: FindCountriesRequest = {}) => {
  const { data, isLoading, error } = useQuery<CountriesResponse>({
    queryKey: [...COUNTRIES_QUERY_KEY, request],
    queryFn: () => sharedRepository.findCountries(request),
    staleTime: 1000 * 60 * 60,
  });

  const countries = data
    ? Object.entries(data).map(([code, name]) => ({ code, name }))
    : [];

  return {
    countries,
    isLoading,
    error: error?.message ?? null,
  };
};
