import { skydropxSettingsRepository } from "@contexts/settings/infrastructure/services/skydropxSettingsRepository";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SaveSkydropxAddressRequest } from "../../domain/schemas/SaveSkydropxAddressRequest";

const SKYDROPX_ADDRESS_QUERY_KEY = ["settings", "skydropx-address"];

export const useHQSettings = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: SKYDROPX_ADDRESS_QUERY_KEY,
    queryFn: () => skydropxSettingsRepository.getAddress(),
  });

  const saveMutation = useMutation({
    mutationFn: (address: SaveSkydropxAddressRequest) =>
      skydropxSettingsRepository.saveAddress(address),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SKYDROPX_ADDRESS_QUERY_KEY });
    },
  });

  return {
    skydropxAddress: data ?? null,
    isLoading,
    error: error?.message ?? null,
    saveAddress: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error?.message ?? null,
  };
};
