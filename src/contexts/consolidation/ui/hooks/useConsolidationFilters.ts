import { useMemo, useState } from "react";
import type { Direction, Filter } from "@contexts/shared/domain/services/CreateCriteriaSchema";
import { useDebouncedValue } from "@contexts/shared/infrastructure/hooks/useDebouncedValue";
import type { ConsolidationStage } from "@contexts/consolidation/domain/schemas/consolidation/ConsolidationStages";

export interface ConsolidationFiltersState {
  searchQuery: string;
  stageFilter: "all" | ConsolidationStage;
}

export interface ConsolidationCriteria {
  search?: string;
  filters: Filter[];
  order: { field: string; direction: Direction };
}

const initialState: ConsolidationFiltersState = {
  searchQuery: "",
  stageFilter: "all",
};

/** Filtros del listado de consolidados (mismo reparto que `useDriverFilters`):
 * el estado de los controles y el criterio que se manda al back. */
export function useConsolidationFilters() {
  const [state, setState] = useState<ConsolidationFiltersState>(initialState);
  const debouncedSearch = useDebouncedValue(state.searchQuery, 300);

  const setFilter = <K extends keyof ConsolidationFiltersState>(
    key: K,
    value: ConsolidationFiltersState[K],
  ) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const reset = () => setState(initialState);

  const criteria = useMemo<ConsolidationCriteria>(
    () => toCriteria(state, debouncedSearch),
    [state, debouncedSearch],
  );

  return { state, setFilter, reset, criteria };
}

function toCriteria(
  state: ConsolidationFiltersState,
  debouncedSearch: string,
): ConsolidationCriteria {
  const filters: Filter[] = [];
  if (state.stageFilter !== "all") {
    filters.push({ field: "stage", filterOperator: "=", value: state.stageFilter });
  }

  return {
    // El back busca en folio, origen y destino.
    search: debouncedSearch.trim() || undefined,
    filters,
    // Los más recientes primero.
    order: { field: "createdAt", direction: "DESC" },
  };
}
