import { useMemo, useState } from "react";
import type { Direction, Filter } from "@contexts/shared/domain/services/CreateCriteriaSchema";
import { useDebouncedValue } from "@contexts/shared/infrastructure/hooks/useDebouncedValue";

export type DatePreset = "all" | "today" | "week" | "month" | "3months" | "custom";
export type NameSort = "none" | "asc" | "desc";
export type DateSort = "none" | "asc" | "desc";

export interface CustomerFiltersState {
  searchQuery: string;
  storeFilter: string;
  cityFilter: string;
  portalFilter: string;
  nameSort: NameSort;
  dateSort: DateSort;
  dateFilter: DatePreset;
  dateFrom: string;
  dateTo: string;
}

export interface CustomerCriteria {
  search?: string;
  filters: Filter[];
  order?: { field: string; direction: Direction };
}

export interface CustomerFilterOptions {
  stores: { id: string; name: string }[];
  cities: string[];
}

const initialState: CustomerFiltersState = {
  searchQuery: "",
  storeFilter: "all",
  cityFilter: "all",
  portalFilter: "all",
  nameSort: "none",
  dateSort: "desc",
  dateFilter: "all",
  dateFrom: "",
  dateTo: "",
};

export function useCustomerFilters() {
  const [state, setState] = useState<CustomerFiltersState>(initialState);
  const debouncedSearch = useDebouncedValue(state.searchQuery, 300);

  const setFilter = <K extends keyof CustomerFiltersState>(
    key: K,
    value: CustomerFiltersState[K],
  ) => {
    setState((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "nameSort" && value !== "none") next.dateSort = "none";
      if (key === "dateSort" && value !== "none") next.nameSort = "none";
      return next;
    });
  };

  const reset = () => setState(initialState);

  const criteria = useMemo<CustomerCriteria>(
    () => toCriteria(state, debouncedSearch),
    [state, debouncedSearch],
  );

  return { state, setFilter, reset, criteria };
}

function toCriteria(
  state: CustomerFiltersState,
  debouncedSearch: string,
): CustomerCriteria {
  const filters: Filter[] = [];

  if (state.storeFilter !== "all") {
    filters.push({ field: "store.id", filterOperator: "=", value: state.storeFilter });
  }
  if (state.cityFilter !== "all") {
    filters.push({ field: "address.city", filterOperator: "=", value: state.cityFilter });
  }
  if (state.portalFilter === "with") {
    filters.push({ field: "user", filterOperator: "IS_NOT_NULL", value: null });
  } else if (state.portalFilter === "without") {
    filters.push({ field: "user", filterOperator: "IS_NULL", value: null });
  }

  pushDateFilter(filters, state.dateFilter, state.dateFrom, state.dateTo);

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

function pushDateFilter(
  filters: Filter[],
  preset: DatePreset,
  dateFrom: string,
  dateTo: string,
) {
  if (preset === "all") return;

  if (preset === "today") {
    filters.push({ field: "createdAt", filterOperator: "IS_TODAY", value: null });
    return;
  }
  if (preset === "week") {
    filters.push({ field: "createdAt", filterOperator: "IN_LAST_DAYS", value: 7 });
    return;
  }
  if (preset === "month") {
    filters.push({ field: "createdAt", filterOperator: "IN_LAST_DAYS", value: 30 });
    return;
  }
  if (preset === "3months") {
    filters.push({ field: "createdAt", filterOperator: "IN_LAST_DAYS", value: 90 });
    return;
  }
  if (preset === "custom") {
    if (dateFrom) {
      filters.push({
        field: "createdAt",
        filterOperator: "AFTER",
        value: new Date(dateFrom + "T00:00:00").toISOString(),
      });
    }
    if (dateTo) {
      filters.push({
        field: "createdAt",
        filterOperator: "BEFORE",
        value: new Date(dateTo + "T23:59:59").toISOString(),
      });
    }
  }
}
