import { useMemo, useState } from "react";
import type { Direction, Filter } from "@contexts/shared/domain/services/CreateCriteriaSchema";
import { useDebouncedValue } from "@contexts/shared/infrastructure/hooks/useDebouncedValue";

export type NameSort = "none" | "asc" | "desc";
export type DateSort = "none" | "asc" | "desc";

export interface StoreFiltersState {
  searchQuery: string;
  nameSort: NameSort;
  dateSort: DateSort;
}

export interface StoreCriteria {
  search?: string;
  filters: Filter[];
  order?: { field: string; direction: Direction };
}

const initialState: StoreFiltersState = {
  searchQuery: "",
  nameSort: "none",
  dateSort: "desc",
};

export function useStoreFilters() {
  const [state, setState] = useState<StoreFiltersState>(initialState);
  const debouncedSearch = useDebouncedValue(state.searchQuery, 300);

  const setFilter = <K extends keyof StoreFiltersState>(
    key: K,
    value: StoreFiltersState[K],
  ) => {
    setState((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "nameSort" && value !== "none") next.dateSort = "none";
      if (key === "dateSort" && value !== "none") next.nameSort = "none";
      return next;
    });
  };

  const reset = () => setState(initialState);

  const criteria = useMemo<StoreCriteria>(
    () => toCriteria(state, debouncedSearch),
    [state, debouncedSearch],
  );

  return { state, setFilter, reset, criteria };
}

function toCriteria(
  state: StoreFiltersState,
  debouncedSearch: string,
): StoreCriteria {
  const order =
    state.nameSort === "asc"
      ? { field: "name", direction: "ASC" as const }
      : state.nameSort === "desc"
        ? { field: "name", direction: "DESC" as const }
        : state.dateSort === "asc"
          ? { field: "createdAt", direction: "ASC" as const }
          : state.dateSort === "desc"
            ? { field: "createdAt", direction: "DESC" as const }
            : undefined;

  return {
    search: debouncedSearch.trim() || undefined,
    filters: [],
    order,
  };
}
