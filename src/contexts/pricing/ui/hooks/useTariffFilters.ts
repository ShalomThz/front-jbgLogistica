import { useMemo, useState } from "react";
import type { Direction, Filter } from "@contexts/shared/domain/services/CreateCriteriaSchema";
import { useDebouncedValue } from "@contexts/shared/infrastructure/hooks/useDebouncedValue";

export type NameSort = "none" | "asc" | "desc";
export type DateSort = "none" | "asc" | "desc";

export interface TariffFiltersState {
  searchQuery: string;
  countryFilter: string;
  nameSort: NameSort;
  dateSort: DateSort;
}

export interface TariffCriteria {
  search?: string;
  filters: Filter[];
  order?: { field: string; direction: Direction };
}

export interface TariffFilterOptions {
  countries: { code: string; name: string }[];
}

const initialState: TariffFiltersState = {
  searchQuery: "",
  countryFilter: "all",
  nameSort: "none",
  dateSort: "desc",
};

export function useTariffFilters() {
  const [state, setState] = useState<TariffFiltersState>(initialState);
  const debouncedSearch = useDebouncedValue(state.searchQuery, 300);

  const setFilter = <K extends keyof TariffFiltersState>(
    key: K,
    value: TariffFiltersState[K],
  ) => {
    setState((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "nameSort" && value !== "none") next.dateSort = "none";
      if (key === "dateSort" && value !== "none") next.nameSort = "none";
      return next;
    });
  };

  const reset = () => setState(initialState);

  const criteria = useMemo<TariffCriteria>(
    () => toCriteria(state, debouncedSearch),
    [state, debouncedSearch],
  );

  return { state, setFilter, reset, criteria };
}

function toCriteria(
  state: TariffFiltersState,
  debouncedSearch: string,
): TariffCriteria {
  const filters: Filter[] = [];

  if (state.countryFilter !== "all") {
    filters.push({
      field: "destinationCountry",
      filterOperator: "=",
      value: state.countryFilter,
    });
  }

  const order =
    state.dateSort === "asc"
      ? { field: "updatedAt", direction: "ASC" as const }
      : state.dateSort === "desc"
        ? { field: "updatedAt", direction: "DESC" as const }
        : undefined;

  return {
    search: debouncedSearch.trim() || undefined,
    filters,
    order,
  };
}

export function applyClientNameSort<T extends { zone: { name: string } }>(
  items: T[],
  nameSort: NameSort,
): T[] {
  if (nameSort === "none") return items;
  const result = [...items];
  if (nameSort === "asc") {
    result.sort((a, b) => a.zone.name.localeCompare(b.zone.name));
  } else {
    result.sort((a, b) => b.zone.name.localeCompare(a.zone.name));
  }
  return result;
}
