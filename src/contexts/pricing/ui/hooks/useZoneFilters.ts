import { useMemo, useState } from "react";
import type { Direction, Filter } from "@contexts/shared/domain/services/CreateCriteriaSchema";
import { useDebouncedValue } from "@contexts/shared/infrastructure/hooks/useDebouncedValue";

export type NameSort = "none" | "asc" | "desc";
export type DateSort = "none" | "asc" | "desc";

export interface ZoneFiltersState {
  searchQuery: string;
  nameSort: NameSort;
  dateSort: DateSort;
}

export interface ZoneCriteria {
  search?: string;
  filters: Filter[];
  order?: { field: string; direction: Direction };
}

const initialState: ZoneFiltersState = {
  searchQuery: "",
  nameSort: "none",
  dateSort: "desc",
};

export function useZoneFilters() {
  const [state, setState] = useState<ZoneFiltersState>(initialState);
  const debouncedSearch = useDebouncedValue(state.searchQuery, 300);

  const setFilter = <K extends keyof ZoneFiltersState>(
    key: K,
    value: ZoneFiltersState[K],
  ) => {
    setState((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "nameSort" && value !== "none") next.dateSort = "none";
      if (key === "dateSort" && value !== "none") next.nameSort = "none";
      return next;
    });
  };

  const reset = () => setState(initialState);

  const criteria = useMemo<ZoneCriteria>(
    () => toCriteria(state, debouncedSearch),
    [state, debouncedSearch],
  );

  return { state, setFilter, reset, criteria };
}

function toCriteria(
  state: ZoneFiltersState,
  debouncedSearch: string,
): ZoneCriteria {
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
