import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { skydropxSettingsRepository } from "@contexts/settings/infrastructure/services/skydropxSettingsRepository";
import type { SkydropxAddressFromPrimitives } from "@contexts/settings/domain/schemas/SkydropxAddressSchema";

const SKYDROPX_ADDRESS_QUERY_KEY = ["settings", "skydropx-address"];

export const useSkydropxSettings = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: SKYDROPX_ADDRESS_QUERY_KEY,
    queryFn: () => skydropxSettingsRepository.getAddress(),
  });

  const saveMutation = useMutation({
    mutationFn: (address: SkydropxAddressFromPrimitives) =>
      skydropxSettingsRepository.saveAddress(address),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SKYDROPX_ADDRESS_QUERY_KEY });
    },
  });

  return {
    skydropxAddress: data?.skydropxAddressFrom ?? null,
    isLoading,
    error: error?.message ?? null,
    saveAddress: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error?.message ?? null,
  };
};
