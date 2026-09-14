import type { SaveVolumetricDivisorRequest } from "@contexts/settings/application/VolumetricDivisor";
import { volumetricDivisorRepository } from "@contexts/settings/infrastructure/services/volumetricDivisorRepository";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const VOLUMETRIC_DIVISOR_QUERY_KEY = ["settings", "volumetric-divisor"];

export const useVolumetricDivisor = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: VOLUMETRIC_DIVISOR_QUERY_KEY,
    queryFn: () => volumetricDivisorRepository.get(),
  });

  const saveMutation = useMutation({
    mutationFn: (request: SaveVolumetricDivisorRequest) =>
      volumetricDivisorRepository.save(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VOLUMETRIC_DIVISOR_QUERY_KEY });
    },
  });

  return {
    volumetricDivisor: data ?? null,
    isLoading,
    error: error?.message ?? null,
    saveVolumetricDivisor: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
};
