import { useDebouncedValue } from "@contexts/shared/infrastructure/hooks/useDebouncedValue";
import { useMemo, useState } from "react";
import type { PackageListViewPrimitives } from "../../domain/WarehousePackageSchema";

export type NameSort = "none" | "asc" | "desc";
export type DateSort = "none" | "asc" | "desc";

export interface WarehouseFiltersState {
  searchQuery: string;
  statusFilter: string;
  nameSort: NameSort;
  dateSort: DateSort;
}

export interface WarehouseCriteria {
  search?: string;
}

interface UseWarehouseFiltersOptions {
  onSearchChange?: () => void;
}

export function useWarehouseFilters({ onSearchChange }: UseWarehouseFiltersOptions = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [nameSort, setNameSort] = useState<NameSort>("none");
  const [dateSort, setDateSort] = useState<DateSort>("desc");

  const debouncedSearch = useDebouncedValue(searchQuery, 500);

  const criteria = useMemo<WarehouseCriteria>(
    () => ({ search: debouncedSearch.trim() || undefined }),
    [debouncedSearch],
  );

  const filters: WarehouseFiltersState = {
    searchQuery,
    statusFilter,
    nameSort,
    dateSort,
  };

  const setFilter = <K extends keyof WarehouseFiltersState>(key: K, value: WarehouseFiltersState[K]) => {
    if (key === "nameSort" && value !== "none") setDateSort("none");
    if (key === "dateSort" && value !== "none") setNameSort("none");
    if (key === "searchQuery") onSearchChange?.();

    const map = {
      searchQuery: setSearchQuery,
      statusFilter: setStatusFilter,
      nameSort: setNameSort,
      dateSort: setDateSort,
    } as const;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (map[key] as any)(value);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setNameSort("none");
    setDateSort("desc");
    onSearchChange?.();
  };

  return { filters, setFilter, resetFilters, criteria };
}

export function applyWarehouseFilters(
  packages: PackageListViewPrimitives[],
  filters: Pick<WarehouseFiltersState, "statusFilter" | "dateSort">,
): PackageListViewPrimitives[] {
  const result = packages.filter((p) =>
    filters.statusFilter === "all" || p.status === filters.statusFilter,
  );

  if (filters.dateSort === "asc") result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  else if (filters.dateSort === "desc") result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return result;
}
