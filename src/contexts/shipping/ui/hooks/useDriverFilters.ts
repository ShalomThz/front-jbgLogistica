import { useMemo, useState } from "react";
import type { Direction, Filter } from "@contexts/shared/domain/services/CreateCriteriaSchema";
import { useDebouncedValue } from "@contexts/shared/infrastructure/hooks/useDebouncedValue";

export type DateSort = "none" | "asc" | "desc";

export interface DriverFiltersState {
  searchQuery: string;
  statusFilter: string;
  dateSort: DateSort;
}

export interface DriverCriteria {
  search?: string;
  filters: Filter[];
  order?: { field: string; direction: Direction };
}

const initialState: DriverFiltersState = {
  searchQuery: "",
  statusFilter: "all",
  dateSort: "desc",
};

export function useDriverFilters() {
  const [state, setState] = useState<DriverFiltersState>(initialState);
  const debouncedSearch = useDebouncedValue(state.searchQuery, 300);

  const setFilter = <K extends keyof DriverFiltersState>(
    key: K,
    value: DriverFiltersState[K],
  ) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const reset = () => setState(initialState);

  const criteria = useMemo<DriverCriteria>(
    () => toCriteria(state, debouncedSearch),
    [state, debouncedSearch],
  );

  return { state, setFilter, reset, criteria };
}

function toCriteria(
  state: DriverFiltersState,
  debouncedSearch: string,
): DriverCriteria {
  const filters: Filter[] = [];

  // Deterministic exact-match filter — `status` isn't (and shouldn't be) one
  // of DRIVER_SEARCH_FIELDS, so it never goes through Meilisearch's fuzzy
  // matching; it's a plain equality filter applied on top of it.
  if (state.statusFilter !== "all") {
    filters.push({ field: "status", filterOperator: "=", value: state.statusFilter });
  }

  const order =
    state.dateSort === "asc"
      ? { field: "createdAt", direction: "ASC" as const }
      : state.dateSort === "desc"
        ? { field: "createdAt", direction: "DESC" as const }
        : undefined;

  return {
    search: debouncedSearch.trim() || undefined,
    filters,
    order,
  };
}
