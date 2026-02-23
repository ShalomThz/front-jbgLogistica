import { useMutation, useQuery } from "@tanstack/react-query";
import { sharedRepository } from "../services/sharedRepository";
import type { AutocompleteResponse } from "../../domain/schemas/address/AutocompleteResponse";

const ADDRESS_QUERY_KEY = ["address-autocomplete"];

interface UseAddressSearchOptions {
  input: string;
}

export const useAddressSearch = ({ input }: UseAddressSearchOptions) => {
  const { data, isLoading, error } = useQuery<AutocompleteResponse>({
    queryKey: [...ADDRESS_QUERY_KEY, input],
    queryFn: () => sharedRepository.autocomplete(input),
    enabled: input.length >= 3,
  });

  const placeDetailsMutation = useMutation({
    mutationFn: (placeId: string) => sharedRepository.placeDetails(placeId),
  });

  return {
    suggestions: data?.suggestions ?? [],
    isLoading,
    error: error?.message ?? null,
    getPlaceDetails: (placeId: string) => placeDetailsMutation.mutateAsync(placeId),
    isLoadingDetails: placeDetailsMutation.isPending,
    detailsError: placeDetailsMutation.error?.message ?? null,
  };
};
