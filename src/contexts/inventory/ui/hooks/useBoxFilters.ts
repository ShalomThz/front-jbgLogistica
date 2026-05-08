import { useMemo, useState } from "react";
import type { Direction, Filter } from "@contexts/shared/domain/services/CreateCriteriaSchema";
import { useDebouncedValue } from "@contexts/shared/infrastructure/hooks/useDebouncedValue";

export type NameSort = "none" | "asc" | "desc";
export type DateSort = "none" | "asc" | "desc";

export interface BoxFiltersState {
  searchQuery: string;
  unitFilter: string;
  nameSort: NameSort;
  dateSort: DateSort;
}

export interface BoxCriteria {
  search?: string;
  filters: Filter[];
  order?: { field: string; direction: Direction };
}

const initialState: BoxFiltersState = {
  searchQuery: "",
  unitFilter: "all",
  nameSort: "none",
  dateSort: "desc",
};

export function useBoxFilters() {
  const [state, setState] = useState<BoxFiltersState>(initialState);
  const debouncedSearch = useDebouncedValue(state.searchQuery, 300);

  const setFilter = <K extends keyof BoxFiltersState>(
    key: K,
    value: BoxFiltersState[K],
  ) => {
    setState((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "nameSort" && value !== "none") next.dateSort = "none";
      if (key === "dateSort" && value !== "none") next.nameSort = "none";
      return next;
    });
  };

  const reset = () => setState(initialState);

  const criteria = useMemo<BoxCriteria>(
    () => toCriteria(state, debouncedSearch),
    [state, debouncedSearch],
  );

  return { state, setFilter, reset, criteria };
}

function toCriteria(
  state: BoxFiltersState,
  debouncedSearch: string,
): BoxCriteria {
  const filters: Filter[] = [];

  if (state.unitFilter !== "all") {
    filters.push({
      field: "dimensions.unit",
      filterOperator: "=",
      value: state.unitFilter,
    });
  }

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
    filters,
    order,
  };
}
