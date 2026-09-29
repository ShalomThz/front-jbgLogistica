import { skydropxSettingsRepository } from "@contexts/settings/infrastructure/services/skydropxSettingsRepository";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import type { SaveSkydropxAddressesRequest } from "../../domain/schemas/SaveSkydropxAddressRequest";

const SKYDROPX_ADDRESSES_QUERY_KEY = ["settings", "skydropx-addresses"];

const EMPTY_ADDRESSES: never[] = [];

/** `enabled` para pedir la lista solo cuando se va a usar: el diálogo de
 * registrar evento se monta en cada orden, abierto o no. */
export const useHQSettings = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: SKYDROPX_ADDRESSES_QUERY_KEY,
    queryFn: () => skydropxSettingsRepository.getAddresses(),
    enabled,
  });

  const saveMutation = useMutation({
    mutationFn: (request: SaveSkydropxAddressesRequest) =>
      skydropxSettingsRepository.saveAddresses(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SKYDROPX_ADDRESSES_QUERY_KEY });
    },
  });

  // Stable reference: only changes when `data` changes, preventing infinite
  // useEffect loops in consumers that depend on this array.
  const skydropxAddresses = useMemo(
    () => data?.skydropxAddresses ?? EMPTY_ADDRESSES,
    [data],
  );

  return {
    skydropxAddresses,
    isLoading,
    error: error?.message ?? null,
    saveAddresses: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error?.message ?? null,
  };
};
