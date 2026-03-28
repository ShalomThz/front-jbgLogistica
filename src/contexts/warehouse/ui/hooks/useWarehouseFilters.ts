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

export function useWarehouseFilters(packages: PackageListViewPrimitives[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [nameSort, setNameSort] = useState<NameSort>("none");
  const [dateSort, setDateSort] = useState<DateSort>("desc");

  const filtered = useMemo(() => {
    const result = packages.filter((p) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        p.id.toLowerCase().includes(query) ||
        p.officialInvoice?.toLowerCase().includes(query) ||
        p.provider.name.toLowerCase().includes(query) ||
        p.customer.name.toLowerCase().includes(query) ||
        p.customer.email.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    if (dateSort === "asc") result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    else if (dateSort === "desc") result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return result;
  }, [packages, searchQuery, statusFilter, dateSort]);

  const filters: WarehouseFiltersState = {
    searchQuery,
    statusFilter,
    nameSort,
    dateSort,
  };

  const setFilter = <K extends keyof WarehouseFiltersState>(key: K, value: WarehouseFiltersState[K]) => {
    if (key === "nameSort" && value !== "none") setDateSort("none");
    if (key === "dateSort" && value !== "none") setNameSort("none");

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
  };

  return { filters, setFilter, resetFilters, filtered };
}
