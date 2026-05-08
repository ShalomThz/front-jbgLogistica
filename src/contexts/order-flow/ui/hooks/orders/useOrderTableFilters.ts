import { useMemo, useState } from "react";
import type { Direction, Filter } from "@contexts/shared/domain/services/CreateCriteriaSchema";
import { useDebouncedValue } from "@contexts/shared/infrastructure/hooks/useDebouncedValue";

export type DatePreset =
  | "all"
  | "today"
  | "week"
  | "month"
  | "3months"
  | "custom";

export type NameSort = "none" | "asc" | "desc";
export type DateSort = "none" | "asc" | "desc";

export interface OrderTableFilterState {
  searchQuery: string;
  statusFilter: string;
  storeFilter: string;
  paymentFilter: string;
  boxFilter: string;
  nameSort: NameSort;
  dateSort: DateSort;
  dateFilter: DatePreset;
  dateFrom: string;
  dateTo: string;
}

export interface OrderCriteria {
  search?: string;
  filters: Filter[];
  order?: { field: string; direction: Direction };
}

const initialState: OrderTableFilterState = {
  searchQuery: "",
  statusFilter: "all",
  storeFilter: "all",
  paymentFilter: "all",
  boxFilter: "all",
  nameSort: "none",
  dateSort: "desc",
  dateFilter: "all",
  dateFrom: "",
  dateTo: "",
};

export function useOrderTableFilters() {
  const [state, setState] = useState<OrderTableFilterState>(initialState);
  const debouncedSearch = useDebouncedValue(state.searchQuery, 300);

  const setFilter = <K extends keyof OrderTableFilterState>(
    key: K,
    value: OrderTableFilterState[K],
  ) => {
    setState((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "nameSort" && value !== "none") next.dateSort = "none";
      if (key === "dateSort" && value !== "none") next.nameSort = "none";
      return next;
    });
  };

  const reset = () => setState(initialState);

  const criteria = useMemo<OrderCriteria>(
    () => toCriteria(state, debouncedSearch),
    [state, debouncedSearch],
  );

  return { state, setFilter, reset, criteria };
}

function toCriteria(
  state: OrderTableFilterState,
  debouncedSearch: string,
): OrderCriteria {
  const filters: Filter[] = [];

  if (state.statusFilter !== "all") {
    filters.push({ field: "status", filterOperator: "=", value: state.statusFilter });
  }
  if (state.storeFilter !== "all") {
    filters.push({ field: "store.id", filterOperator: "=", value: state.storeFilter });
  }
  if (state.paymentFilter === "paid") {
    filters.push({ field: "financials.isPaid", filterOperator: "=", value: true });
  } else if (state.paymentFilter === "unpaid") {
    filters.push({ field: "financials.isPaid", filterOperator: "=", value: false });
  }
  if (state.boxFilter !== "all") {
    filters.push({ field: "package.boxId", filterOperator: "=", value: state.boxFilter });
  }

  pushDateFilter(filters, state.dateFilter, state.dateFrom, state.dateTo);

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

export function applyClientNameSort<T extends { destination: { name: string } }>(
  items: T[],
  nameSort: NameSort,
): T[] {
  if (nameSort === "none") return items;
  const result = [...items];
  if (nameSort === "asc") {
    result.sort((a, b) => a.destination.name.localeCompare(b.destination.name));
  } else {
    result.sort((a, b) => b.destination.name.localeCompare(a.destination.name));
  }
  return result;
}
