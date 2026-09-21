import { useQuery } from "@tanstack/react-query";
import { sharedRepository } from "../services/sharedRepository";
import type { SearchStatesResponse } from "@contexts/shared/application/SearchStates";

const STATES_QUERY_KEY = ["states"];

/**
 * El proveedor no lista los estados de un país sin texto: hay que teclear. Dos
 * caracteres es donde las sugerencias dejan de ser ruido.
 */
export const MIN_STATE_QUERY_LENGTH = 2;

interface UseStatesOptions {
  country: string | undefined;
  query: string;
  enabled?: boolean;
}

export const useStates = ({ country, query, enabled = true }: UseStatesOptions) => {
  const trimmed = query.trim();

  const { data, isLoading, error } = useQuery<SearchStatesResponse>({
    queryKey: [...STATES_QUERY_KEY, country, trimmed],
    queryFn: () => sharedRepository.searchStates(country!, trimmed),
    enabled: enabled && !!country && trimmed.length >= MIN_STATE_QUERY_LENGTH,
    // La división política de un país no cambia en una sesión, y cada consulta
    // se le paga al proveedor: volver a teclear lo mismo no vuelve a pedirlo.
    staleTime: 1000 * 60 * 60,
  });

  return {
    states: data?.states ?? [],
    isLoading,
    error: error?.message ?? null,
  };
};
